// For newest-first Resend lists that have no date filter: keep the rows inside the
// timeframe, and stop paging once a page reaches rows older than its start.
const rows = (data && data.data) || [];
const start = new Date(context.timeframe.start).getTime();
const end = new Date(context.timeframe.end).getTime();
const createdAt = (row) => new Date(row.created_at).getTime();

result = rows.filter((row) => createdAt(row) >= start && createdAt(row) <= end);

// Every timeframe offered ends now, so time since its end is time spent paging. Stop
// early on busy accounts, returning the newest rows rather than timing out.
const pagingBudgetMs = 20000;
const last = rows[rows.length - 1];
const morePages = data && data.has_more && last && createdAt(last) >= start;
pagingContext = morePages && Date.now() - end < pagingBudgetMs ? last.id : undefined;
