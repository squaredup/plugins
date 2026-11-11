// dataStreams/scripts/scheduleShifts.js
// Picks the entry list (final by default, or scheduled / overrides), flattens
// the user, and derives durationHours and isCurrent from the shift times.
const type = (context.config && context.config.entryType) || "final";
const entries = (data.schedule_entries && data.schedule_entries[type]) || [];
const now = Date.now();

result = entries.map((entry) => {
    const start = new Date(entry.start_at).getTime();
    const end = new Date(entry.end_at).getTime();
    return {
        "user.name": entry.user ? entry.user.name : null,
        "user.email": entry.user ? entry.user.email : null,
        start_at: entry.start_at,
        end_at: entry.end_at,
        rotation_id: entry.rotation_id || null,
        layer_id: entry.layer_id || null,
        durationHours: (end - start) / 3600000,
        isCurrent: start <= now && now < end,
        entry_id: entry.entry_id || null,
        fingerprint: entry.fingerprint || null,
    };
});
