// Broadcast recipients page by cursor like every Resend list (see list.js). Clicked
// recipients carry clicked_links as [{ url, clicks }]; flatten those to plain URL
// strings so the column can be a real list.
const rows = (data && data.data) || [];

result = rows.map((row) => ({
    ...row,
    clicked_links: Array.isArray(row.clicked_links) ? row.clicked_links.map((l) => l.url) : row.clicked_links
}));
pagingContext = data && data.has_more && rows.length ? rows[rows.length - 1].id : undefined;
