// Process NinjaOne ticketing board data
const items = (data && data.data && Array.isArray(data.data)) ? data.data : (Array.isArray(data) ? data : []);

/**
 * Recursively converts NinjaOne Unix timestamps (seconds) to ISO strings.
 * @param {any} obj 
 * @returns {any}
 */
const convertTimestamps = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'number') {
             const lowerKey = key.toLowerCase();
             // NinjaOne ticketing uses createdAt, updatedAt, closedAt, etc.
             if (lowerKey.includes('time') || lowerKey.includes('date') || lowerKey.includes('at')) {
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
        // Normalize IDs as strings for SquaredUp correlation
        id: converted.id ? converted.id.toString() : null,
        organizationId: (converted.organizationId || converted.clientId) ? (converted.organizationId || converted.clientId).toString() : null,
        deviceId: (converted.deviceId || converted.nodeId) ? (converted.deviceId || converted.nodeId).toString() : null,
        boardId: converted.boardId ? converted.boardId.toString() : null,
        requesterId: converted.requesterId ? converted.requesterId.toString() : null,
        assigneeId: (converted.assigneeId || converted.assignedAppUserId) ? (converted.assigneeId || converted.assignedAppUserId).toString() : null,
        ticketFormId: converted.ticketFormId ? converted.ticketFormId.toString() : null,
        // Ensure tags are a comma-separated string if they are an array
        tags: Array.isArray(converted.tags) ? converted.tags.join(', ') : converted.tags
    };
});
