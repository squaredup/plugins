// Handle NinjaOne paged response for backup usage
const items = (data && data.results ? data.results : []);
result = items.map(item => ({ ...item, id: item.id ? item.id.toString() : null }));
