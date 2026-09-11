// GET /restores/status/accounts requires companyId, with accountId as an optional extra filter on
// the same call (confirmed against RedAPI's OpenAPI spec) — so this scopes the request to a
// single account server-side instead of fetching the whole company and filtering here. Falls back
// to a single row from the account object itself if no statusHistory array is present, since
// Redstor returns no status at all for accounts with no restore activity (see README known
// limitations).
const account = data?.results?.[0];
const history = account?.statusHistory;

if (history) {
    result = history.map((entry) => ({ timestamp: entry.timestamp, status: entry.status }));
} else if (account) {
    result = [{ timestamp: account.timestamp ?? null, status: account.status ?? null }];
} else {
    result = [];
}
