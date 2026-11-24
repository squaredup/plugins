// Graph annotates Int64 and other typed values with "<column>@odata.type" keys. A custom query has
// no column metadata to hide them, so drop them from each row.
result = (data && Array.isArray(data.results) ? data.results : []).map((row) => {
    const clean = {};
    Object.keys(row).forEach((key) => {
        if (!key.endsWith('@odata.type')) {
            clean[key] = row[key];
        }
    });
    return clean;
});
