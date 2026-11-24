// Keeps label and site ID keys on every row, empty when absent, so their lookup columns stay in
// the result even when no row has a value. Drops empty user IDs.
result = (data && Array.isArray(data.results) ? data.results : []).map((row) => {
    ['labelId', 'previousLabelId', 'siteUrl'].forEach((key) => {
        if (!row[key]) {
            row[key] = '';
        }
    });
    if (!row.userId) {
        delete row.userId;
    }
    return row;
});
