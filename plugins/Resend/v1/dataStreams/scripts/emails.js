// Newest-first Resend email lists with no date or domain filter: keep rows inside the
// timeframe, stop paging once a page reaches rows older than its start, and optionally
// keep only emails on a selected domain: sent emails by their from address, received
// emails by their to addresses.
const rows = (data && data.data) || [];
const start = new Date(context.timeframe.start).getTime();
const end = new Date(context.timeframe.end).getTime();
const createdAt = (row) => new Date(row.created_at).getTime();

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const wanted = new Set(
    ((context.config && context.config.domain) || []).map((o) => String(unwrap(o.name) || '').toLowerCase()).filter(Boolean)
);
// Addresses look like "Name <user@example.com>" or "user@example.com"
const domainOf = (address) => String(address || '').split('@').pop().replace('>', '').trim().toLowerCase();
// Only received emails list their attachments
const isReceived = (row) => Array.isArray(row.attachments);
const matchesDomain = (row) =>
    !wanted.size || (isReceived(row) ? [].concat(row.to || []) : [row.from]).some((a) => wanted.has(domainOf(a)));

result = rows
    .filter((row) => createdAt(row) >= start && createdAt(row) <= end && matchesDomain(row))
    .map((row) => (isReceived(row) ? { ...row, attachment_count: row.attachments.length } : row));

// Every timeframe offered ends now, so time since its end is time spent paging. Stop
// early on busy accounts, returning the newest emails rather than timing out.
const pagingBudgetMs = 20000;
const last = rows[rows.length - 1];
const morePages = data && data.has_more && last && createdAt(last) >= start;
pagingContext = morePages && Date.now() - end < pagingBudgetMs ? last.id : undefined;
