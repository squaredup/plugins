const deviceIds = context.objects.map(o => o.deviceId.toString());
const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));
result = items.filter(item => deviceIds.includes(item.deviceId ? item.deviceId.toString() : null));
