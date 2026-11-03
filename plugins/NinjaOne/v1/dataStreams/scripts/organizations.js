// Handle NinjaOne array or paged response and convert numeric IDs to strings for SquaredUp compatibility
const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));
result = items.map(item => ({ 
    ...item, 
    id: item.id ? item.id.toString() : null,
    organizationId: item.id ? item.id.toString() : null,
    // Add parent.id for scoped child requests (LCP convention)
    'parent.id': item.id ? item.id.toString() : null
}));

// NinjaOne's /v2/organizations response is a bare array with no next-page token, so the
// cursor is derived here (last id in the raw page) and set directly as pagingContext.
pagingContext = items.length ? items[items.length - 1].id : undefined;
