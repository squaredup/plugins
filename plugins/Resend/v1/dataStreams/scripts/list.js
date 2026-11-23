// Resend lists return { has_more, data } and page by cursor: the next page starts
// after the last row's id. That id isn't at a fixed payload path, so it's set here.
const rows = (data && data.data) || [];

result = rows;
pagingContext = data && data.has_more && rows.length ? rows[rows.length - 1].id : undefined;
