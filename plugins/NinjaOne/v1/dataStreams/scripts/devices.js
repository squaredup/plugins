// Handle NinjaOne array or paged response and convert numeric IDs to strings for SquaredUp compatibility
const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));

/**
 * Recursively converts NinjaOne Unix timestamps (seconds) to ISO strings.
 * NinjaOne typically returns timestamps as floats/integers in seconds.
 * SquaredUp's date shape/JS Date expects milliseconds or ISO strings.
 * @param {any} obj 
 * @returns {any}
 */
const convertTimestamps = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'number') {
             // Heuristic: check if key name suggests a timestamp and value is in seconds range (1e9 to 1e10)
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

const processedItems = items.map(item => {
    // Recursively convert timestamps in the item (modifies in place but we are mapping to a new object)
    const converted = convertTimestamps(item);
    
    return { 
        ...converted, 
        deviceId: converted.id ? converted.id.toString() : null, 
        id: converted.id ? converted.id.toString() : null,
        // Ensure displayName is present for the import engine (maps to systemName if missing)
        displayName: converted.displayName || converted.systemName || converted.dnsName || (converted.id ? `Device ${converted.id}` : 'Unknown Device'),
        // Add organizationId and locationId as strings if they are there
        organizationId: converted.organizationId ? converted.organizationId.toString() : null,
        locationId: converted.locationId ? converted.locationId.toString() : null
    };
});

// For flat array responses (like /v2/organization/{id}/devices), wrap the output
// so pagination can find `next_page_token` and `results`.
// For already wrapped responses (like /v2/devices), return an array and preserve metadata.
if (Array.isArray(data)) {
    result = {
        results: processedItems,
        next_page_token: processedItems.length > 0 ? processedItems[processedItems.length - 1].id : null
    };
} else {
    result = processedItems;
    if (data && data.metadata) {
        result.metadata = data.metadata;
    }
}
