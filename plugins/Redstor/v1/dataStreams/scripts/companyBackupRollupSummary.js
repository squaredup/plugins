// GET /backups/status/summary returns two arrays for the queried companyId: "companySummary"
// (that company's own backups) and "customerSummary" (rolled up across its customer companies,
// when the company is a Redstor Partner) — tag each row with which one it came from.
const tag = (rows, scope) => (rows || []).map((row) => ({ ...row, scope }));

result = [...tag(data.companySummary, "This company"), ...tag(data.customerSummary, "Customer companies")];
