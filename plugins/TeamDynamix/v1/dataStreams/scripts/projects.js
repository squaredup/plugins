// A Project has 120 fields, most of them baseline/initial variants of the same value
// (EndDateBaseline, EndDateInitial, EstimatedHoursInitial, TimeBudgetInitial ...) plus
// AlternateManagers, CustomColumns and NonWorkingDays arrays. Projected to the fields that
// answer "is this project on track", which also keeps the unpaged response under the ~6MB
// stream response cap.
//
// No custom-attribute columns: the API's own description for this endpoint says Attributes,
// CustomColumns and NonWorkingDays are never included in search results — only loading a
// project individually returns them, which this stream doesn't do.

result = (data || []).map((project) => ({
    projectId: String(project.ID),
    name: project.Name || `Project ${project.ID}`,
    healthName: project.HealthName || "None",
    statusName: project.StatusName || "",
    percentComplete: typeof project.PercentComplete === "number" ? project.PercentComplete : null,
    managerName: project.AdminName || "",
    sponsorName: project.SponsorName || "",
    accountName: project.AccountName || "",
    typeName: project.TypeName || "",
    priorityName: project.PriorityName || "",
    classificationName: project.ClassificationName || "",
    serviceName: project.ServiceName || "",
    startDate: project.StartDate || null,
    endDate: project.EndDate || null,
    estimatedHours: typeof project.EstimatedHours === "number" ? project.EstimatedHours : null,
    actualHours: typeof project.ActualHours === "number" ? project.ActualHours : null,
    budget: typeof project.Budget === "number" ? project.Budget : null,
    expensesBudget: typeof project.ExpensesBudget === "number" ? project.ExpensesBudget : null,
    expensesBudgetUsed:
        typeof project.ExpensesBudgetUsed === "number" ? project.ExpensesBudgetUsed : null,
    isActive: Boolean(project.IsActive),
    statusLastUpdated: project.StatusModifiedDate || null,
    createdDate: project.CreatedDate || null,
    appId: String(project.AppID ?? "")
}));
