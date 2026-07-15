// api/projects/{id}/query/ returns COLUMNAR JSON for HogQLQuery results:
// { results: [[v1,v2],...], columns: [...], types: [...] }
// Columns are arbitrary/user-defined (query is user-supplied), so they must be
// zipped into row objects dynamically here rather than declared statically.
const cols = data.columns || [];
result = (data.results || []).map((r) =>
    Object.fromEntries(cols.map((c, i) => [c, r[i]])),
);
