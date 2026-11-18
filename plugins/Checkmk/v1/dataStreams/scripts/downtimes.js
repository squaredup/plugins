// Older Checkmk versions return Unix seconds here, newer ones ISO 8601 strings
const toIso = (t) => {
    if (!t) {
        return null;
    }
    const d = typeof t === 'number' ? new Date(t * 1000) : new Date(t);
    return isNaN(d.getTime()) ? null : d.toISOString();
};

const now = Date.now();

result = ((data && data.value) || []).map((d) => {
    const e = d.extensions || {};
    const start = toIso(e.start_time);
    const end = toIso(e.end_time);
    return {
        hostName: e.host_name,
        service: e.is_service === 'yes' || e.is_service === true ? e.service_description || null : null,
        comment: e.comment || d.title || null,
        author: e.author || null,
        start,
        end,
        active: Boolean(start && end && Date.parse(start) <= now && now < Date.parse(end)),
        recurring: Boolean(e.recurring && e.recurring !== 'no' && e.recurring !== 'no recurring'),
        downtimeId: String(d.id)
    };
});
