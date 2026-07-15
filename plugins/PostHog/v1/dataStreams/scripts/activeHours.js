// api/projects/{id}/query/ returns COLUMNAR JSON for HogQLQuery results:
// { results: [[v1,v2,v3],...], columns: ["day_of_week","hour_of_day","events"], types: [...] }
// This is not an object array, so it must be zipped into row objects here.
const DAY_NAMES = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    7: "Sun",
};

const cols = data.columns || [];
result = (data.results || []).map((r) => {
    const row = Object.fromEntries(
        cols.map((c, i) => [
            c,
            ["day_of_week", "hour_of_day", "events"].includes(c)
                ? Number(r[i])
                : r[i],
        ]),
    );
    row.day_name = DAY_NAMES[row.day_of_week] || String(row.day_of_week);
    return row;
});
