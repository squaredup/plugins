// The paged search is asked for a single ticket; only its TotalCount is used. That counts every
// match, where the Tickets stream stops at Maximum tickets (2,000 by default) and a busy
// application can have several times that many open. A missing total is left empty rather
// than shown as 0.
result = [{ tickets: typeof data?.TotalCount === "number" ? data.TotalCount : null }];
