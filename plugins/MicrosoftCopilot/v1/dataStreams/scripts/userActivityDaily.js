// Microsoft keeps per-user daily Copilot activity for about a week, one report per day. The
// first request (the 7-day summary) only supplies the report's refresh date. Each later
// request fetches one day, starting at the refresh date and stepping back a day at a time,
// by handing the next day's report URL back as the paging context. It stops after 7 days,
// or sooner if a day comes back empty, so it never asks for a date outside the window.
const DAYS = 7;
const DAY = 86400000;
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.users) || [];
const upns = new Set(
    selected.map((o) => String(unwrap(o.userPrincipalName) ?? "").toLowerCase()).filter(Boolean),
);

const reportUrl = (day) =>
    `https://${url.host}/beta/copilot/reports/getMicrosoft365CopilotUsageUserDetailByDate(date=${day})?$format=application/json`;
const shift = (day, n) => new Date(Date.parse(day + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);

const APPS = [
    ["isActiveInM365Chat", "Copilot Chat (work)"],
    ["isActiveInBusinessChatWeb", "Copilot Chat (web)"],
    ["isActiveInTeams", "Teams"],
    ["isActiveInOutlook", "Outlook"],
    ["isActiveInWord", "Word"],
    ["isActiveInExcel", "Excel"],
    ["isActiveInPowerPoint", "PowerPoint"],
    ["isActiveInOneNote", "OneNote"],
    ["isActiveInLoop", "Loop"],
    ["isActiveInM365CopilotChatCopilotApp", "Microsoft 365 Copilot app"],
    ["isActiveInEdge", "Edge"],
];

const isSummary = !context.pagingContext;
if (isSummary) {
    const refresh = ((data && data.value && data.value[0]) || {}).reportRefreshDate;
    pagingContext = refresh ? reportUrl(String(refresh).slice(0, 10)) : undefined;
    result = [];
} else {
    const rows = (data && data.value) || [];
    const first = rows[0] || {};
    const match = String(context.pagingContext).match(/date=([0-9-]{10})/);
    const day = first.reportSelectedDate || (match && match[1]);
    const refresh = first.reportRefreshDate;
    const morePages = data && data["@odata.nextLink"];
    const earlier = day && refresh ? shift(day, -1) : null;
    pagingContext = morePages
        ? morePages
        : rows.length && earlier && earlier > shift(refresh, -DAYS)
          ? reportUrl(earlier)
          : undefined;

    result = rows
        .filter((r) => !upns.size || upns.has(String(r.userPrincipalName ?? "").toLowerCase()))
        .map((r) => ({
            date: r.reportSelectedDate ? `${r.reportSelectedDate}T00:00:00Z` : null,
            displayName: r.displayName,
            userPrincipalName: r.userPrincipalName,
            isActive: r.isActive === true,
            activeUser: r.isActive === true ? 1 : 0,
            promptsSubmitted: Number(r.allAppsCopilotActionCount) || 0,
            chatWorkPrompts: Number(r.m365ChatQueriesSubmitted) || 0,
            chatWebPrompts: Number(r.businessChatWebPromptsCount) || 0,
            activeApps: APPS.filter(([key]) => r[key] === true).map(([, name]) => name),
            reportRefreshDate: r.reportRefreshDate || null,
        }));
}
