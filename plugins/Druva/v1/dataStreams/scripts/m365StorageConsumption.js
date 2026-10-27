// Optional `customer` object picker; empty means all customers. The picker's
// objects carry the Customer sourceId (the Druva customer global id) as `rawId`.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.customer) || [];
const customerIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

result = (data.data || []).filter(
    (r) => !customerIds.size || customerIds.has(r.customerGlobalId)
);

// Druva returns `nextPageToken` as an empty string on the last page rather than
// omitting it, so the platform's built-in token extraction reads "" as a valid
// cursor and trips the paging loop guard. Normalise to undefined to end paging.
pagingContext = data.nextPageToken || undefined;
