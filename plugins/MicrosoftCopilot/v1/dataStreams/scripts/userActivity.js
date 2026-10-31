// One row per licensed user. Optional `users` object picker narrows the rows
// by userPrincipalName (index properties arrive as single-element arrays).
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.users) || [];
const upns = new Set(
    selected
        .map((o) => String(unwrap(o.userPrincipalName) ?? "").toLowerCase())
        .filter(Boolean),
);

const DAY = 86400000;
const toDate = (s) => (s ? new Date(s + "T00:00:00Z") : null);
const orNull = (s) => s || null;

const rows = (data.value ?? []).filter(
    (r) => !upns.size || upns.has(String(r.userPrincipalName ?? "").toLowerCase()),
);

result = rows.map((r) => {
    // Days are counted from the report's own refresh date (it lags real time
    // by a day or two), so the figure matches the data rather than today.
    const refresh = toDate(r.reportRefreshDate);
    const last = toDate(r.lastActivityDate);
    const days = refresh && last ? Math.round((refresh - last) / DAY) : null;
    // Rule: no activity ever = error; > 28 days idle = error; > 7 = warning.
    const activity =
        days === null || days > 28 ? "error" : days > 7 ? "warning" : "success";
    const p = (r.copilotActivityUserDetailsByPeriod ?? [])[0] ?? {};
    return {
        displayName: r.displayName,
        userPrincipalName: r.userPrincipalName,
        lastActivityDate: orNull(r.lastActivityDate),
        daysSinceLastActivity: days,
        activityState: activity,
        promptsSubmitted: p.promptsSubmittedAllApps ?? 0,
        activeDays: p.activeUsageDaysAllApps ?? 0,
        copilotChatLastActivityDate: orNull(r.copilotChatLastActivityDate),
        teamsLastActivityDate: orNull(r.microsoftTeamsCopilotLastActivityDate),
        wordLastActivityDate: orNull(r.wordCopilotLastActivityDate),
        excelLastActivityDate: orNull(r.excelCopilotLastActivityDate),
        powerPointLastActivityDate: orNull(r.powerPointCopilotLastActivityDate),
        outlookLastActivityDate: orNull(r.outlookCopilotLastActivityDate),
        oneNoteLastActivityDate: orNull(r.oneNoteCopilotLastActivityDate),
        loopLastActivityDate: orNull(r.loopCopilotLastActivityDate),
        reportRefreshDate: orNull(r.reportRefreshDate),
    };
});
