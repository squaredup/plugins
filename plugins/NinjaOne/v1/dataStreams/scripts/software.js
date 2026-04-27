const deviceIds = '{{objects.map((o) => o.deviceId)}}'.split(',');
const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));
result = items.filter(item => deviceIds.includes(item.deviceId ? item.deviceId.toString() : null));
