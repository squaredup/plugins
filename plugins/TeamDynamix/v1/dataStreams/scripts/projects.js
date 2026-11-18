// A Project has 120 fields, most of them baseline/initial variants of the same value
// (EndDateBaseline, EndDateInitial, EstimatedHoursInitial, TimeBudgetInitial ...) plus
// AlternateManagers, CustomColumns and NonWorkingDays arrays. Projected to the fields that
// answer "is this project on track", which also keeps the unpaged response under the ~6MB
// stream response cap.
//
// No custom-attribute columns: the API's own description for this endpoint says Attributes,
// CustomColumns and NonWorkingDays are never included in search results — only loading a
// project individually returns them, which this stream doesn't do.

// TeamDynamix never sends null for an unset date: it sends 0001-01-01T00:00:00 (.NET's minimum
// date), which SquaredUp displays as 12/31/1900 and which passes "not empty" filters. Anything
// before 1901-01-02 is treated as unset, which covers that value however it is normalised.
const UNSET_DATE_BEFORE = Date.parse("1901-01-02T00:00:00Z");
const realDate = (value) => (value && Date.parse(value) >= UNSET_DATE_BEFORE ? value : null);

result = (Array.isArray(data) ? data : []).map((project) => ({
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
    startDate: realDate(project.StartDate),
    endDate: realDate(project.EndDate),
    estimatedHours: typeof project.EstimatedHours === "number" ? project.EstimatedHours : null,
    actualHours: typeof project.ActualHours === "number" ? project.ActualHours : null,
    budget: typeof project.Budget === "number" ? project.Budget : null,
    expensesBudget: typeof project.ExpensesBudget === "number" ? project.ExpensesBudget : null,
    expensesBudgetUsed:
        typeof project.ExpensesBudgetUsed === "number" ? project.ExpensesBudgetUsed : null,
    isActive: Boolean(project.IsActive),
    statusLastUpdated: realDate(project.StatusModifiedDate),
    createdDate: realDate(project.CreatedDate),
    appId: String(project.AppID ?? "")
}));
