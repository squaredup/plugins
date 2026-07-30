// wows/encyclopedia/ships returns `data` as an object keyed by ship_id — flatten to rows.
// The response body is a keyed object, not an array, so the platform's built-in
// offset/token paging can't count rows to know whether to fetch another page.
// Drive it manually via the postRequestScript pagingContext override.
//
// Wargaming returns HTTP 200 even for a page past the real end, with
// {"status":"error","error":{"message":"PAGE_NO_NOT_FOUND",...}} — that is the
// authoritative stop signal, checked explicitly rather than inferred from a
// short page (a full 100-row page could in principle coincide with the last
// page; the API's own error is unambiguous either way).
const isPageError = data && data.status === 'error';
const rows = isPageError ? [] : Object.values(data.data || {}).filter(Boolean);
result = rows;

const count = data.meta?.count;
const limit = data.meta?.limit;
const page = data.meta?.page;
const total = data.meta?.total;

// A short page (count < limit) means this was the last page. But if the true
// total happens to be an exact multiple of the page size, the last page's
// count also equals limit — catch that case too by checking whether every
// page up to and including this one already covers the reported total, so we
// never overshoot into the PAGE_NO_NOT_FOUND page.
const isLastPage = count !== limit || page * limit >= total;

if (isPageError) {
    pagingContext = undefined;

    api.report.error(data.error?.message || 'Unknown error', data);
} else if (isLastPage) {
    pagingContext = undefined;
} else {
    pagingContext = page + 1;
}
