// Only the columns the stream exposes are returned: each page is up to 500
// rows and a wide timeframe otherwise exceeds the ~6MB response cap.
result = (data.data || [])
    .map((r) => ({
        customerGlobalId: r.customerGlobalId,
        customerName: r.customerName,
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
// cursor, re-requests with it, and trips the paging loop guard.
// Normalise the empty string to undefined here to end paging.
pagingContext = data.nextPageToken || undefined;
