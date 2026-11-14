// One row per report date x app. Tenant-level prompts are only set on the "Any app" row.
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
const days = ((data && data.value && data.value[0] && data.value[0].adoptionByDate) || [])
    .slice()
    .sort((a, b) => String(a.reportDate).localeCompare(String(b.reportDate)));
result = days.flatMap((day) =>
    APPS.filter(([key]) => day[key + "EnabledUsers"] !== undefined).map(([key, name]) => ({
        reportDate: day.reportDate,
        app: name,
        enabledUsers: day[key + "EnabledUsers"],
        activeUsers: day[key + "ActiveUsers"],
        promptsSubmitted: key === "anyApp" ? day.promptsSubmitted : null,
    })),
);
