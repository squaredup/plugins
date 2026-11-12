if (!data || !Array.isArray(data.incidents)) {
    api.report.error('The status page did not return an incident list.');
}

const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const toMs = (s) => {
    const t = s ? new Date(s).getTime() : NaN;
    return isNaN(t) ? undefined : t;
};
const formatDay = (ms) => new Date(ms).toISOString().slice(0, 10);

// Severity order, worst last. Operational (and anything unrecognised) has no level: it only ends an interval.
const LEVELS = { under_maintenance: 1, degraded_performance: 2, partial_outage: 3, major_outage: 4 };

const now = Date.now();
const tf = context.timeframe || {};
const windowStart = toMs(tf.start) ?? now - 30 * DAY;
const windowEnd = Math.min(toMs(tf.end) ?? now, now);
const windowMinutes = Math.max(windowEnd - windowStart, 0) / MINUTE;

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.components) || [];
const selectedIds = new Set(
    (Array.isArray(selected) ? selected : [selected]).map((o) => unwrap(o && o.rawId)).filter(Boolean)
);

// incidents.json carries no full component list, so fetch it from the same API so components without incidents
// still report 100%. `url` is the incidents.json request URL.
let pageComponents;
try {
    const base =
        typeof url !== 'undefined'
            ? url
            : context.dataSources && context.dataSources[0] && context.dataSources[0].baseUrl;
    const response = await fetch(new URL('components.json', base).href);
    const body = response.ok ? await response.json() : undefined;
    pageComponents = body && Array.isArray(body.components) ? body.components : undefined;
} catch (e) {
    pageComponents = undefined;
}

const incidents = data.incidents;

// Rebuild each component's status timeline per incident. Updates are listed newest first; an affected_components
// entry puts that component into new_status until its next entry in the same incident, or until the incident
// resolves (operational from then on). Intervals past the resolve time are cut there.
const intervalsByComponent = new Map(); // code -> [{ start, end, level }]
const incidentSpans = new Map(); // code -> Map(incidentId -> { first, last })
const mentioned = new Map(); // code -> name, for the fallback list
let unattributed = 0;

for (const incident of incidents) {
    const started = Math.min(toMs(incident.created_at) ?? Infinity, toMs(incident.started_at) ?? Infinity);
    const closed = incident.status === 'resolved' || incident.status === 'postmortem';
    const updates = (incident.incident_updates || [])
        .map((u) => ({ at: toMs(u.display_at || u.created_at), affected: u.affected_components || [] }))
        .filter((u) => u.at !== undefined)
        .reverse()
        .sort((a, b) => a.at - b.at);
    const lastUpdate = updates.length > 0 ? updates[updates.length - 1].at : undefined;
    const resolvedAt = closed ? (toMs(incident.resolved_at) ?? lastUpdate) : undefined;
    const openEnd = resolvedAt ?? now;

    if (!updates.some((u) => u.affected.length > 0)) {
        // Nothing says which component was hit or when, so the incident can't be attributed. Only count ones
        // that overlap the window and, when filtering, that name a selected component (or name none at all).
        const spanEnd = Math.max(openEnd, started);
        const componentIds = (incident.components || []).map((c) => c.id);
        const relevant =
            selectedIds.size === 0 || componentIds.length === 0 || componentIds.some((id) => selectedIds.has(id));
        if (started <= windowEnd && spanEnd >= windowStart && relevant) {
            unattributed++;
        }
        continue;
    }

    const open = new Map(); // code -> { level, from }
    const close = (code, until) => {
        const current = open.get(code);
        if (!current) return;
        const end = Math.min(until, openEnd);
        const span = incidentSpans.get(code).get(incident.id);
        span.last = Math.max(span.last, Math.max(end, current.from));
        // end < start happens on pages that backdate resolved_at before the updates; ignore those intervals.
        if (current.level && end > current.from) {
            intervalsByComponent.get(code).push({ start: current.from, end, level: current.level });
        }
    };

    for (const update of updates) {
        for (const affected of update.affected) {
            const code = affected.code;
            if (!code) continue;
            if (!intervalsByComponent.has(code)) {
                intervalsByComponent.set(code, []);
                incidentSpans.set(code, new Map());
            }
            mentioned.set(code, affected.name);
            const spans = incidentSpans.get(code);
            if (!spans.has(incident.id)) {
                spans.set(incident.id, { first: update.at, last: update.at });
            }
            close(code, update.at);
            open.set(code, { level: LEVELS[affected.new_status], from: update.at });
        }
    }
    for (const code of open.keys()) {
        close(code, openEnd);
    }
}

// Overlapping incidents can hold the same component in different states; count each moment once, at the worst.
const minutesByLevel = (intervals) => {
    const events = [];
    for (const i of intervals) {
        const start = Math.max(i.start, windowStart);
        const end = Math.min(i.end, windowEnd);
        if (end > start) {
            events.push([start, i.level, 1], [end, i.level, -1]);
        }
    }
    events.sort((a, b) => a[0] - b[0]);
    const active = [0, 0, 0, 0, 0];
    const totals = [0, 0, 0, 0, 0];
    let previous;
    for (const [at, level, delta] of events) {
        if (previous !== undefined && at > previous) {
            let worst = active.length - 1;
            while (worst > 0 && active[worst] === 0) worst--;
            if (worst > 0) totals[worst] += at - previous;
        }
        active[level] += delta;
        previous = at;
    }
    return totals.map((ms) => ms / MINUTE);
};

// incidents.json returns only the 50 most recent incidents, so a busy page's history may not reach the window start.
const oldestStart = Math.min(
    ...incidents.map((i) => Math.min(toMs(i.created_at) ?? Infinity, toMs(i.started_at) ?? Infinity))
);
const historyTruncated = incidents.length >= 50 && oldestStart > windowStart;
const historyFrom = new Date(historyTruncated ? oldestStart : windowStart).toISOString();

const warnings = [];
if (historyTruncated) {
    warnings.push(
        `Incident history only reaches back to ${formatDay(oldestStart)}; reliability before then is assumed operational.`
    );
}
if (unattributed > 0) {
    warnings.push(
        `${unattributed} incident${unattributed === 1 ? '' : 's'} in this timeframe list${unattributed === 1 ? 's' : ''} no affected components, so ${
            unattributed === 1 ? 'it is' : 'they are'
        } not counted.`
    );
}
if (!pageComponents) {
    warnings.push('The component list could not be loaded, so only components named in incidents are shown.');
}
if (warnings.length > 0) {
    api.report.warning(warnings.join(' '));
}

// Components that are no longer on the page (only seen in old incidents) are dropped when the list is available.
let components;
if (pageComponents) {
    const groups = new Map(pageComponents.filter((c) => c.group).map((c) => [c.id, c.name]));
    components = pageComponents
        .filter((c) => !c.group)
        .map((c) => ({ id: c.id, name: c.name, group: c.group_id ? groups.get(c.group_id) : 'Ungrouped' }));
} else {
    // incident.components gives the plain name (affected_components names carry a "Group - " prefix) and group_id,
    // but group names are only known if a group itself was listed on an incident.
    const known = new Map();
    for (const incident of incidents) {
        for (const c of incident.components || []) known.set(c.id, c);
    }
    const groupNames = new Map([...known.values()].filter((c) => c.group).map((c) => [c.id, c.name]));
    components = [...mentioned].map(([id, name]) => {
        const c = known.get(id);
        const groupId = c && c.group_id;
        return { id, name: (c && c.name) || name, group: groupId ? groupNames.get(groupId) : 'Ungrouped' };
    });
}

// The same name can appear in several groups (e.g. "API" per region), so qualify a repeated name with its group.
const nameCounts = new Map();
for (const c of components) nameCounts.set(c.name, (nameCounts.get(c.name) || 0) + 1);

result = components
    .filter((c) => selectedIds.size === 0 || selectedIds.has(c.id))
    .map((c) => {
        const [, maintenance, degraded, partial, major] = minutesByLevel(intervalsByComponent.get(c.id) || []);
        const spans = incidentSpans.get(c.id) || new Map();
        const incidentCount = [...spans.values()].filter((s) => s.first <= windowEnd && s.last >= windowStart).length;
        const percentUp = (downMinutes) => (windowMinutes > 0 ? 100 * (1 - downMinutes / windowMinutes) : undefined);

        return {
            component: nameCounts.get(c.name) > 1 && c.group ? `${c.group} / ${c.name}` : c.name,
            id: c.id,
            group: c.group,
            incidentCount,
            majorOutageMinutes: major,
            partialOutageMinutes: partial,
            degradedMinutes: degraded,
            maintenanceMinutes: maintenance,
            availabilityPercent: percentUp(major),
            operationalPercent: percentUp(degraded + partial + major),
            historyFrom,
            basis: 'Estimated from incident updates'
        };
    });
