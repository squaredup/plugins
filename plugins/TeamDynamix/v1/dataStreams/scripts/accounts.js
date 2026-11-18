// Projected rather than passed through: an Account carries an Attributes array of custom
// fields and four separate address lines that add bulk without adding anything a dashboard
// or the graph uses.
// TeamDynamix never sends null for an unset date: it sends 0001-01-01T00:00:00 (.NET's minimum
// date), which SquaredUp displays as 12/31/1900 and which passes "not empty" filters. Anything
// before 1901-01-02 is treated as unset, which covers that value however it is normalised.
const UNSET_DATE_BEFORE = Date.parse("1901-01-02T00:00:00Z");
const realDate = (value) => (value && Date.parse(value) >= UNSET_DATE_BEFORE ? value : null);

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
    createdDate: realDate(account.CreatedDate)
}));
