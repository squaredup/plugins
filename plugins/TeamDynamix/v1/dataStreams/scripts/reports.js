// Feeds the report picker on the Report stream. Names alone aren't unique (a tenant can hold
// hundreds of reports, several with the same name in different applications), so the label
// carries the report's source and application.
result = (Array.isArray(data) ? data : [])
    .map((report) => ({
        label: `${report.Name} (${[report.ReportSourceName, report.PlatformAppName].filter(Boolean).join(", ")})`,
        value: String(report.ID),
        sourceName: report.ReportSourceName || "",
        appName: report.PlatformAppName || "",
        owningGroupName: report.OwningGroupName || ""
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
