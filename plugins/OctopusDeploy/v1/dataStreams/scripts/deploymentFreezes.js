// Freezes are server-level and carry no status: work out whether each is active, scheduled or expired here.
const HOUR = 3600000;
const now = Date.now();
const scoped = context.objects[0].rawId;
const iso = (ms) => new Date(ms).toISOString();
const round1 = (n) => Math.round(n * 10) / 10;

const scopeIds = (f) => {
    const projects = new Set(Object.keys(f.ProjectEnvironmentScope || {}));
    const environments = new Set([].concat(...Object.values(f.ProjectEnvironmentScope || {})));
    const tenants = new Set();
    (f.TenantProjectEnvironmentScope || []).forEach((t) => {
        projects.add(t.ProjectId);
        environments.add(t.EnvironmentId);
        tenants.add(t.TenantId);
    });
    return { projects, environments, tenants };
};

// Shift a start time forward by n recurrence intervals
const shift = (ms, type, unit, n) => {
    const d = new Date(ms);
    const step = unit * n;
    if (type === 'Daily') d.setUTCDate(d.getUTCDate() + step);
    else if (type === 'Weekly') d.setUTCDate(d.getUTCDate() + 7 * step);
    else if (type === 'Monthly') d.setUTCMonth(d.getUTCMonth() + step);
    else if (type === 'Annually') d.setUTCFullYear(d.getUTCFullYear() + step);
    return d.getTime();
};

// Returns the current or next window for a freeze, or null if there is none left
const nextWindow = (f) => {
    const start = Date.parse(f.Start);
    const end = Date.parse(f.End);
    const r = f.RecurringSchedule;
    if (!r || !r.Type || !(start <= end)) return now < end ? { start, end } : null;
    const unit = r.Unit || 1;
    const length = end - start;
    const lastEnd = r.EndType === 'OnDate' && r.EndOnDate ? Date.parse(r.EndOnDate) : Infinity;
    const maxN = r.EndType === 'AfterOccurrences' && r.EndAfterOccurrences ? r.EndAfterOccurrences - 1 : Infinity;
    for (let n = 0; n <= Math.min(maxN, 5000); n++) {
        const s = shift(start, r.Type, unit, n);
        if (s > lastEnd) return null;
        if (s + length > now) return { start: s, end: s + length };
    }
    return null;
};

const describe = (r) => {
    if (!r || !r.Type) return null;
    const unit = r.Unit || 1;
    const noun = { Daily: 'day', Weekly: 'week', Monthly: 'month', Annually: 'year' }[r.Type] || r.Type;
    const every = unit === 1 ? `Every ${noun}` : `Every ${unit} ${noun}s`;
    const until =
        r.EndType === 'OnDate' && r.EndOnDate
            ? `, until ${r.EndOnDate.slice(0, 10)}`
            : r.EndType === 'AfterOccurrences'
              ? `, ${r.EndAfterOccurrences} times`
              : '';
    return every + until;
};

// Freezes are server-wide and carry no space, so a Space scope returns them only for the
// default space; otherwise every space in a multi-space tile would repeat them.
const isDefaultSpace = String([].concat(context.objects[0].isDefault)[0]) === 'true';

const keep = (ids) =>
    (!scoped.startsWith('Spaces-') || isDefaultSpace) &&
    (!scoped.startsWith('Projects-') || ids.projects.has(scoped)) &&
    (!scoped.startsWith('Environments-') || ids.environments.has(scoped)) &&
    (!scoped.startsWith('Tenants-') || ids.tenants.has(scoped));

// pathToData is ignored when a post-request script is set, so read the array here.
result = ((data && data.DeploymentFreezes) || [])
    .map((f) => ({ f, ids: scopeIds(f), w: nextWindow(f) }))
    .filter((x) => x.w && keep(x.ids))
    .map(({ f, ids, w }) => {
        const active = w.start <= now;
        const status = active ? 'Active' : 'Scheduled';
        const scopes = Object.entries(f.ProjectEnvironmentScope || {}).map(([p, envs]) => `${p}: ${envs.join(', ')}`);
        const tenantScopes = (f.TenantProjectEnvironmentScope || []).map(
            (t) => `${t.TenantId}/${t.ProjectId}/${t.EnvironmentId}`
        );
        return {
            id: f.Id,
            name: f.Name,
            description: f.Description || null,
            status,
            freezeState: status,
            start: iso(w.start),
            end: iso(w.end),
            hoursRemaining: active ? round1((w.end - now) / HOUR) : null,
            startsInHours: active ? null : round1((w.start - now) / HOUR),
            recurring: !!(f.RecurringSchedule && f.RecurringSchedule.Type),
            schedule: describe(f.RecurringSchedule),
            projectCount: ids.projects.size,
            environmentCount: ids.environments.size,
            tenantCount: ids.tenants.size,
            scopeSummary: scopes.concat(tenantScopes).join('; ') || null
        };
    })
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
