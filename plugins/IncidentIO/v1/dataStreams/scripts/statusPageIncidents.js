// dataStreams/scripts/statusPageIncidents.js
// Component names are not on the incident payload, so affectedComponents lists component ids.
const impactRank = { degraded_performance: 1, partial_outage: 2, full_outage: 3 };
const stateFor = { investigating: 'error', identified: 'error', monitoring: 'warning', resolved: 'success' };
const time = (v) => (v ? new Date(v).getTime() : 0);

result = (data.status_page_incidents || []).map((incident) => {
    const updates = (incident.updates || []).slice().sort((a, b) => time(a.published_at) - time(b.published_at));
    const latest = updates.length ? updates[updates.length - 1] : null;
    const resolvedUpdate = updates.filter((u) => u.incident_status === 'resolved').pop();
    const resolvedAt = resolvedUpdate ? resolvedUpdate.published_at : null;
    const impacts = incident.component_impacts || [];

    let worst = null;
    impacts.forEach((impact) => {
        if (!worst || (impactRank[impact.component_status] || 0) > (impactRank[worst] || 0)) {
            worst = impact.component_status;
        }
    });

    const componentIds = [...new Set(impacts.map((i) => i.component_id))];
    const duration =
        resolvedAt && incident.published_at
            ? Math.max(0, Math.round((time(resolvedAt) - time(incident.published_at)) / 60000))
            : null;

    return {
        id: incident.id,
        name: incident.name,
        incidentStatus: incident.incident_status,
        statusState: stateFor[incident.incident_status] || 'unknown',
        publishedAt: incident.published_at,
        resolvedAt,
        durationMinutes: duration,
        affectedComponents: componentIds.join(', '),
        worstImpact: worst,
        latestUpdate: latest ? latest.message : null,
    };
});
