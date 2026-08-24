// api/projects/{id}/query/ returns COLUMNAR JSON for HogQLQuery results:
// { results: [[v1,v2,v3],...], columns: ["path","visitors","views"], types: [...] }
// This is not an object array, so it must be zipped into row objects here.
const cols = data.columns || [];
result = (data.results || []).map((r) =>
    Object.fromEntries(
        cols.map((c, i) => [
            c,
            c === "visitors" || c === "views" ? Number(r[i]) : r[i],
        ]),
    ),
);
