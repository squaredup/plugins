// Keeps the label ID key on every row, empty when unlabelled, so the label lookup columns
// stay in the result even when no row has a label. Drops empty user IDs.
result = (data && Array.isArray(data.results) ? data.results : []).map((row) => {
    if (!row.sensitivityLabelId) {
        row.sensitivityLabelId = '';
    }
    if (!row.userId) {
        delete row.userId;
    }
    return row;
});
