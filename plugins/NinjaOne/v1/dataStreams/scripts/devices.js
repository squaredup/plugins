const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));

const convertTimestamps = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'number') {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('time') || lowerKey.includes('date') || lowerKey.includes('contact') || lowerKey.includes('update') || lowerKey.includes('start') || lowerKey.includes('end')) {
                if (val > 1000000000 && val < 10000000000) {
                    obj[key] = new Date(val * 1000).toISOString();
                }
            }
        } else if (typeof val === 'object' && val !== null) {
            convertTimestamps(val);
        }
    }
    return obj;
};

result = items.map(item => {
    const converted = convertTimestamps(item);
    return {
        ...converted,
        deviceId: converted.id ? converted.id.toString() : null,
        id: converted.id ? converted.id.toString() : null,
        displayName: converted.displayName || converted.systemName || converted.dnsName || (converted.id ? `Device ${converted.id}` : 'Unknown Device'),
        organizationId: converted.organizationId ? converted.organizationId.toString() : null,
        locationId: converted.locationId ? converted.locationId.toString() : null
    };
});

// NinjaOne's /v2/devices response is a bare array with no next-page token, so the cursor
// is derived here (last id in the raw page) and set directly as pagingContext.
pagingContext = items.length ? items[items.length - 1].id : undefined;
