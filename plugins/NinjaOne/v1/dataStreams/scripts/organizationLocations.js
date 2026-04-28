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
