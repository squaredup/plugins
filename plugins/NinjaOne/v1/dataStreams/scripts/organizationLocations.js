const orgIds = context.objects.map(o => o.organizationId.toString());
const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));
result = items
    .filter(item => orgIds.includes(item.organizationId ? item.organizationId.toString() : null))
    .map(item => ({
        ...item,
        locationId: item.id ? item.id.toString() : null,
        id: item.id ? item.id.toString() : null,
        organizationId: item.organizationId ? item.organizationId.toString() : null
    }));

// Cursor must track the raw (unfiltered) API page, not the org-filtered result,
// or pages of locations belonging to other organizations would be skipped.
pagingContext = items.length ? items[items.length - 1].id : undefined;
