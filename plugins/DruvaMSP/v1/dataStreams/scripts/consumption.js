// Optional `customer` object picker; empty means all customers.
// The Customer sourceId is the Druva customerGlobalId, so rawId compares directly.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.customer) || [];
const customerIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

// Only the columns the stream exposes are returned: each page is up to 500
// rows and a wide timeframe otherwise exceeds the ~6MB response cap.
result = (data.data || [])
    .filter((r) => !customerIds.size || customerIds.has(r.customerGlobalId))
    .map((r) => ({
        customerGlobalId: r.customerGlobalId,
        productName: r.productName,
        productModule: r.productModule,
        entityName: r.entityName,
        servicePlanName: r.servicePlanName,
        data: r.data,
        units: r.units,
        date: r.date,
        instanceId: r.instanceId
    }));

// Druva returns `nextPageToken` as an empty string on the last page rather than
// omitting it, so the platform's built-in token extraction reads "" as a valid
// cursor, re-requests with `pageToken=`, and trips the paging loop guard.
// Normalise the empty string to undefined here to end paging.
pagingContext = data.nextPageToken || undefined;
