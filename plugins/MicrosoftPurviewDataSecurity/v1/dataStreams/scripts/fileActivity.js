// Keeps the site ID key on every row, empty when absent, so the site lookup column stays in the
// result even when no row has a site. Drops empty user IDs.
result = (data && Array.isArray(data.results) ? data.results : []).map((row) => {
    if (!row.siteUrl) {
        row.siteUrl = '';
    }
    if (!row.userId) {
        delete row.userId;
    }
    return row;
});
