// One row per app. Prompt totals are tenant-level, so they are only set on the "Any app" row.
const APPS = [
    ["microsoftTeams", "Teams"],
    ["word", "Word"],
    ["excel", "Excel"],
    ["powerPoint", "PowerPoint"],
    ["outlook", "Outlook"],
    ["oneNote", "OneNote"],
    ["loop", "Loop"],
    ["copilotChatWork", "Copilot Chat (work)"],
    ["copilotChatWeb", "Copilot Chat (web)"],
    ["copilotChat", "Copilot Chat (all)"],
    ["m365App", "Microsoft 365 app"],
    ["edge", "Edge"],
    ["anyApp", "Any app"],
];
const report = (data && data.value && data.value[0]) || {};
const a = (report.adoptionByProduct && report.adoptionByProduct[0]) || {};
const days = parseInt(String(a.reportPeriod || "").replace(/[^0-9]/g, ""), 10);
result = APPS.filter(([key]) => a[key + "EnabledUsers"] !== undefined).map(([key, name]) => {
    const enabled = a[key + "EnabledUsers"];
    const active = a[key + "ActiveUsers"];
    const isAny = key === "anyApp";
    return {
        app: name,
        enabledUsers: enabled,
        activeUsers: active,
        activeRate: enabled > 0 ? (active / enabled) * 100 : null,
        totalPrompts: isAny ? a.totalPromptsSubmitted : null,
        averagePrompts: isAny ? a.averagePromptsSubmitted : null,
        periodDays: Number.isNaN(days) ? null : days,
        reportRefreshDate: report.reportRefreshDate,
    };
});
