// Handle NinjaOne array or paged response and convert numeric IDs to strings for SquaredUp compatibility
const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));
result = items.map(item => ({ 
    ...item, 
    id: item.id ? item.id.toString() : null,
    organizationId: item.id ? item.id.toString() : null,
    // Add parent.id for scoped child requests (LCP convention)
    'parent.id': item.id ? item.id.toString() : null 
}));
