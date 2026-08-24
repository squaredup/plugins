// api/projects/{id}/query/ returns COLUMNAR JSON for HogQLQuery results:
// { results: [[v1,v2,v3,v4],...], columns: ["path","rage_clicks","dead_clicks","errors"], types: [...] }
// This is not an object array, so it must be zipped into row objects here.
const cols = data.columns || [];
const numericCols = new Set(["rage_clicks", "dead_clicks", "errors"]);
result = (data.results || []).map((r) =>
    Object.fromEntries(
        cols.map((c, i) => [c, numericCols.has(c) ? Number(r[i]) : r[i]]),
    ),
);
