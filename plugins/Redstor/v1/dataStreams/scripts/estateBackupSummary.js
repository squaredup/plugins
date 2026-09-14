// GET /backups/status/summary returns two arrays by product: companySummary
// (the configured Partner company) and customerSummary (rolled up across every
// customer beneath it) — tag each row with its scope so both can still be told
// apart, while a tile that groups by product alone combines the two.
const tag = (rows, scope) => (rows || []).map((row) => ({ scope, ...row }));

result = [...tag(data?.companySummary, "Partner company"), ...tag(data?.customerSummary, "Customer companies")];
