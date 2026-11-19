// dataStreams/scripts/scheduleShifts.js
// Picks the entry list (final by default, or scheduled / overrides), flattens
// the user one level (as expandInnerObjects did before this script existed, so
// columns such as user.id are kept), and derives durationHours and isCurrent.
const pick = (v) => (Array.isArray(v) ? v[0] && (v[0].value || v[0]) : v && (v.value || v));
const type = pick(context.config && context.config.entryType) || "final";
const entries = (data.schedule_entries && data.schedule_entries[type]) || [];
const now = Date.now();

result = entries.map((entry) => {
    const { user, ...rest } = entry;
    const userColumns = Object.fromEntries(Object.entries(user || {}).map(([key, value]) => ["user." + key, value]));
    const start = new Date(entry.start_at).getTime();
    const end = new Date(entry.end_at).getTime();
    return {
        ...rest,
        ...userColumns,
        "user.name": user ? user.name : null,
        "user.email": user ? user.email : null,
        rotation_id: entry.rotation_id || null,
        layer_id: entry.layer_id || null,
        durationHours: (end - start) / 3600000,
        isCurrent: start <= now && now < end,
        entry_id: entry.entry_id || null,
        fingerprint: entry.fingerprint || null,
    };
});
