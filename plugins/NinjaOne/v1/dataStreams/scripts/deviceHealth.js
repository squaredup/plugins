// Handle NinjaOne paged response for device health
const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));

const convertTimestamps = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'number') {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('time') || lowerKey.includes('date') || lowerKey.includes('contact') || lowerKey.includes('update') || lowerKey.includes('start') || lowerKey.includes('end') || lowerKey.includes('expires')) {
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

const formatProductsInstallationStatuses = (statuses) => {
    if (!statuses || typeof statuses !== 'object') return statuses;
    const parts = [];
    for (const [product, status] of Object.entries(statuses)) {
        parts.push(`${product}: ${status}`);
    }
    return parts.join(', ');
};

result = items.map(item => {
    const converted = convertTimestamps(item);
    const transformed = { ...converted };
    if (transformed.deviceId !== undefined) transformed.deviceId = transformed.deviceId.toString();
    if (transformed.parentDeviceId !== undefined) transformed.parentDeviceId = transformed.parentDeviceId.toString();
    if (transformed.productsInstallationStatuses !== undefined) {
        transformed.productsInstallationStatuses = formatProductsInstallationStatuses(transformed.productsInstallationStatuses);
    }
    return transformed;
});