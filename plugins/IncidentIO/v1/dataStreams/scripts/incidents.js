// dataStreams/scripts/incidents.js
// duration_metrics[] and incident_role_assignments[] are arrays of objects,
// which expandInnerObjects (one level) and valueExpression can't reach. Derive
// flat scalar fields here and spread the raw incident, so the nested objects
// (incident_status, severity, incident_type) still flatten to their dotted columns.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

// Optional `team` object picker: the API has no team filter, so filter here.
const selectedTeams = new Set(
    ((context.config && context.config.team) || []).map((o) => unwrap(o.rawId)).filter(Boolean),
);

const OPEN_CATEGORIES = ["triage", "live", "paused"];

const roleHolder = (incident, roleType) => {
    const entry = (incident.incident_role_assignments || []).find(
        (a) => a.role && a.role.role_type === roleType && a.assignee,
    );
    return entry ? entry.assignee.name : null;
};

const metricMinutes = (incident, pattern) => {
    const metric = (incident.duration_metrics || []).find(
        (m) => m.status === "success" && m.duration_metric && pattern.test(m.duration_metric.name),
    );
    return metric && typeof metric.value_seconds === "number" ? metric.value_seconds / 60 : null;
};

result = (data.incidents || [])
    .filter(
        (incident) =>
            selectedTeams.size === 0 || (incident.team_ids || []).some((id) => selectedTeams.has(id)),
    )
    .map((raw) => {
        // The consumed arrays are replaced by the derived scalar fields below.
        const { incident_role_assignments, duration_metrics, team_ids, ...incident } = raw;
        return {
            ...incident,
            isOpen: OPEN_CATEGORIES.includes(raw.incident_status && raw.incident_status.category),
            lead: roleHolder(raw, "lead"),
            reporter: roleHolder(raw, "reporter"),
            teamIds: raw.team_ids || [],
            timeToResolveMinutes: metricMinutes(raw, /resolv/i),
            durationMinutes: metricMinutes(raw, /duration/i),
        };
    });
