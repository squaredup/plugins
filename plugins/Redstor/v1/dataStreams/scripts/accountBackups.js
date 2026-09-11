// GET /backups/status/accounts requires companyId, with accountId as an optional extra filter on
// the same call (confirmed against RedAPI's OpenAPI spec) — so this scopes the request to a
// single account server-side instead of fetching the whole company and filtering here.
const account = data?.results?.[0];
const history = account?.statusHistory || [];

result = history.map((entry) => ({
    timestamp: entry.timestamp,
    status: entry.status,
    message: entry.message,
    errorCount: entry.errorCount,
}));
