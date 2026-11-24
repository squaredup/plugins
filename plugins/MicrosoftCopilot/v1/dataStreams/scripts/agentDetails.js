// One row for the agent: the registry's usage figures for it, each over the last 30 days.
// Despite its name, exceptionRate is the number of exceptions in that time (Microsoft's docs).
const DAY = 86400000;
const p = data || {};
const used = p.lastUsedDateTime ? new Date(p.lastUsedDateTime) : null;
const count = (v) => (Array.isArray(v) ? v.length : null);
result = [
    {
        id: p.id,
        displayName: p.displayName || p.id,
        activeUsers: typeof p.activeUsers === "number" ? p.activeUsers : null,
        totalSessions: typeof p.totalSessions === "number" ? p.totalSessions : null,
        totalRunTimeInHours: typeof p.totalRunTimeInHours === "number" ? p.totalRunTimeInHours : null,
        lastUsedDateTime: p.lastUsedDateTime || null,
        daysSinceUsed: used ? Math.floor((Date.now() - used) / DAY) : null,
        exceptions: typeof p.exceptionRate === "number" ? p.exceptionRate : null,
        sensitivity: p.sensitivity || null,
        categories: p.categories || [],
        sharedWithCount: count(p.sharedWithUsersAndGroups),
        allowedCount: count(p.allowedUsersAndGroups),
        longDescription: p.longDescription || p.shortDescription || null,
    },
];
