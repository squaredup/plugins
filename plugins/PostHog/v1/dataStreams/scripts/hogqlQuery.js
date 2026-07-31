// api/projects/{id}/query/ returns COLUMNAR JSON for HogQLQuery results:
// { results: [[v1,v2],...], columns: [...], types: [...] }
// Columns are arbitrary/user-defined (query is user-supplied), so they must be
// zipped into row objects dynamically here rather than declared statically.
const cols = data.columns || [];
// HogQL is user-supplied, so it can return duplicate column names (e.g.
// `SELECT count(), count()`). Object.fromEntries would silently drop all but
// the last, so disambiguate repeats before zipping cells into row objects.
const seen = new Set();
const uniqueCols = cols.map((col) => {
    let name = col;
    let suffix = 2;
    while (seen.has(name)) {
        name = `${col}_${suffix++}`;
    }
    seen.add(name);
    return name;
});
result = (data.results || []).map((r) =>
    Object.fromEntries(uniqueCols.map((c, i) => [c, r[i]])),
);
