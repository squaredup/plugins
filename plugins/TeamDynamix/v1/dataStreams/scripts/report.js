// Search results never include custom attributes, and loading assets one by one is out of reach
// on a large estate (one request each, under a 30-a-minute rate limit). A Report Builder report
// can include custom attributes as columns and returns every row in one request, so this stream
// runs a report the customer has built and passes its columns through.
//
// Rows key custom attribute values by attribute ID ("3177"), so columns are renamed to the
// report's own header text. Two columns can share a header (a report can show the same
// attribute twice, or an attribute named like a built-in field), so a repeat gets its key
// appended. A dot would be read as a nested path, so it is replaced.

// TeamDynamix never sends null for an unset date: it sends 0001-01-01T00:00:00 (.NET's minimum
// date), which SquaredUp displays as 12/31/1900. Anything before 1901-01-02 is treated as unset.
const UNSET_DATE_BEFORE = Date.parse("1901-01-02T00:00:00Z");
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/;
const cell = (value) =>
    typeof value === "string" && ISO_DATE.test(value) && Date.parse(value) < UNSET_DATE_BEFORE
        ? null
        : value;

const columns = Array.isArray(data?.DisplayedColumns) ? data.DisplayedColumns : [];
const used = new Set();
const names = columns.map((column) => {
    const header = String(column.HeaderText || column.ColumnName).replace(/\./g, " ").trim();
    let name = header;
    for (let n = 1; used.has(name); n++) {
        name = n === 1 ? `${header} (${column.ColumnName})` : `${header} (${column.ColumnName} ${n})`;
    }
    used.add(name);
    // Built-in ID columns (AssetID, TicketID…) are numbers on the wire, which would be shown
    // with a thousands separator ("42,665"), so they are passed as text.
    return { key: column.ColumnName, name, isId: /ID$/.test(column.ColumnName) };
});

result = (Array.isArray(data?.DataRows) ? data.DataRows : []).map((row) =>
    Object.fromEntries(
        names.map(({ key, name, isId }) => {
            const value = cell(row[key] ?? null);
            return [name, isId && typeof value === "number" ? String(value) : value];
        })
    )
);
