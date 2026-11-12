// Read-only keys return a check's `unique_key`; read-write keys return its
// `uuid` instead. Healthchecks.io derives `unique_key` from the UUID (SHA-1 of
// its first 16 hex digits), so computing it here gives every check the same
// id whichever key type the data source uses.
const sha1Hex = async (text) => {
    const digest = await crypto.subtle.digest(
        "SHA-1",
        new TextEncoder().encode(text),
    );
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
};
const uniqueKeyOf = (c) =>
    c.unique_key || sha1Hex(c.uuid.replace(/-/g, "").slice(0, 16));

// Optional `checks` object picker (or a bound dashboard variable). Empty or
// absent means every check in the project.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.checks) || [];
const selectedIds = new Set(
    selected.map((o) => unwrap(o.rawId)).filter(Boolean),
);

// A schedule is either a cron expression (five space-separated fields) or a
// systemd OnCalendar expression; checks without one use a simple period.
const kindOf = (schedule) => {
    if (!schedule) {
        return "Simple";
    }
    return schedule.trim().split(/\s+/).length === 5 ? "Cron" : "OnCalendar";
};

const checks = await Promise.all(
    ((data && data.checks) || []).map(async (c) => {
        const id = await uniqueKeyOf(c);
        return {
            ...c,
            id,
            name: c.name || c.slug || id,
            kind: kindOf(c.schedule),
            // The API returns tags as one space-separated string.
            tags: (c.tags || "").split(/\s+/).filter(Boolean),
        };
    }),
);

result = checks.filter((c) => !selectedIds.size || selectedIds.has(c.id));
