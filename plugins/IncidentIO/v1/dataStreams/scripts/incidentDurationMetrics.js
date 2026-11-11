// dataStreams/scripts/incidentDurationMetrics.js
// One row per incident per duration metric. duration_metrics[] is an array of
// objects, which can't be expanded into rows declaratively.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

// Optional `team` object picker: the API has no team filter, so filter here.
const selectedTeams = new Set(
    ((context.config && context.config.team) || []).map((o) => unwrap(o.rawId)).filter(Boolean),
);
const includeIncomplete =
    context.config &&
    (context.config.includeIncomplete === true || context.config.includeIncomplete === "true");

const rows = [];
(data.incidents || [])
    .filter(
        (incident) =>
            selectedTeams.size === 0 || (incident.team_ids || []).some((id) => selectedTeams.has(id)),
    )
    .forEach((incident) => {
        (incident.duration_metrics || []).forEach((metric) => {
            const complete = metric.status === "success";
            if (!complete && !includeIncomplete) {
                return;
            }
            const seconds = typeof metric.value_seconds === "number" ? metric.value_seconds : null;
            rows.push({
                incidentId: incident.id,
                reference: incident.reference,
                incidentName: incident.name,
                severity: incident.severity ? incident.severity.name : null,
                incidentType: incident.incident_type ? incident.incident_type.name : null,
                statusCategory: incident.incident_status ? incident.incident_status.category : null,
                created_at: incident.created_at,
                metricName: metric.duration_metric ? metric.duration_metric.name : null,
                status: metric.status,
                valueMinutes: seconds === null ? null : seconds / 60,
                valueHours: seconds === null ? null : seconds / 3600,
            });
        });
    });
result = rows;
