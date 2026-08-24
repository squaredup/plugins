// Projected rather than passed through: an Account carries an Attributes array of custom
// fields and four separate address lines that add bulk without adding anything a dashboard
// or the graph uses.
result = (Array.isArray(data) ? data : []).map((account) => ({
    accountId: String(account.ID),
    name: account.Name,
    code: account.Code || "",
    managerName: account.ManagerFullName || "",
    parentName: account.ParentName || "",
    industryName: account.IndustryName || "",
    city: account.City || "",
    stateName: account.StateName || "",
    country: account.Country || "",
    createdDate: account.CreatedDate || null
}));
