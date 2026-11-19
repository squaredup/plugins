// dataStreams/scripts/incidents.js
// duration_metrics[] and incident_role_assignments[] are arrays of objects,
// which expandInnerObjects (one level) and valueExpression can't reach. Derive
// flat scalar fields here and spread the raw incident, so the nested objects
// (incident_status, severity, incident_type) still flatten to their dotted columns
// and the raw arrays stay available as they were before this script existed.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

// Optional `team` object picker: the API has no team filter, so filter here.
const selectedTeams = new Set(
    ((context.config && context.config.team) || []).map((o) => unwrap(o.rawId)).filter(Boolean),
);

// Optional `catalogEntry` object picker: matches incidents whose catalog-backed custom
// fields (e.g. Affected services) reference one of the selected entries.
const selectedEntries = new Set(
    ((context.config && context.config.catalogEntry) || []).map((o) => unwrap(o.rawId)).filter(Boolean),
);
const catalogEntriesOf = (incident) => {
    const byId = new Map();
    (incident.custom_field_entries || []).forEach((field) =>
        (field.values || []).forEach((value) => {
            const entry = value.value_catalog_entry;
            if (entry && entry.id) byId.set(entry.id, entry);
        }),
    );
    return [...byId.values()];
};
const matchesEntries = (incident) =>
    selectedEntries.size === 0 || catalogEntriesOf(incident).some((entry) => selectedEntries.has(entry.id));

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
    .filter(matchesEntries)
    .map((raw) => {
        const entries = catalogEntriesOf(raw);
        return {
            ...raw,
            isOpen: OPEN_CATEGORIES.includes(raw.incident_status && raw.incident_status.category),
            lead: roleHolder(raw, "lead"),
            reporter: roleHolder(raw, "reporter"),
            teamIds: raw.team_ids || [],
            catalogEntryIds: entries.map((entry) => entry.id),
            catalogEntries: entries.map((entry) => entry.name),
            timeToResolveMinutes: metricMinutes(raw, /resolv/i),
            durationMinutes: metricMinutes(raw, /duration/i),
        };
    });
