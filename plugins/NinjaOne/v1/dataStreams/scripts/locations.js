// Handle NinjaOne array or paged response and convert numeric IDs to strings for SquaredUp compatibility
const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));
result = items.map(item => ({ 
    ...item, 
    locationId: item.id ? item.id.toString() : null, 
    id: item.id ? item.id.toString() : null,
    // Add organizationId as string if it's there
    organizationId: item.organizationId ? item.organizationId.toString() : null
}));
