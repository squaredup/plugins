// Handle NinjaOne paged response for backup jobs
const items = (data && data.results && Array.isArray(data.results)) ? data.results : (Array.isArray(data) ? data : []);

/**
 * Recursively convert Unix-second timestamps to ISO strings.
 * Based on the conversion used in devices.js.
 */
const convertTimestamps = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'number') {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('time') || lowerKey.includes('date') ||
                lowerKey.includes('start') || lowerKey.includes('end')) {
                if (val > 1_000_000_000 && val < 10_000_000_000) {
                    obj[key] = new Date(val * 1000).toISOString();
                }
            }
        } else if (typeof val === 'object' && val !== null) {
            convertTimestamps(val);
        }
    }
    return obj;
};

const filteredItems = items.filter(item => item != null);
const processedItems = filteredItems.map(item => {
    // Convert timestamps in the item (including nested upsyncJob)
    const converted = convertTimestamps(item);
    
    // Convert numeric IDs to strings
    const idFields = ['deviceId', 'organizationId', 'locationId'];
    idFields.forEach(field => {
        if (converted[field] !== undefined) {
            converted[field] = converted[field].toString();
        }
    });

    return converted;
});

// Preserve the cursor object for token-based pagination
result = { results: processedItems };
if (data && data.cursor) {
    result.cursor = data.cursor;
}

// Return the transformed payload
result;