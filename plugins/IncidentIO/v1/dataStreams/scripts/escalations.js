// dataStreams/scripts/escalations.js
// Derives acknowledgement time/user from the events[] history and lists the
// related incidents' names and alerts' titles.
// Stateless per-row transform, so per-page execution is safe.
const names = (list, field) =>
    (list || [])
        .map((item) => item && item[field])
        .filter(Boolean);

const creatorName = (creator) => {
    if (!creator) return null;
    if (creator.user) return creator.user.name || creator.user.email || null;
    if (creator.alert) return creator.alert.title || "Alert";
    if (creator.workflow) return creator.workflow.name || "Workflow";
    return null;
};

result = (data.escalations || []).map((escalation) => {
    const events = escalation.events || [];
    const ack = events
        .filter((event) => event.event === "acked")
        .sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at))[0];
    const ackedAt = ack ? ack.occurred_at : null;
    const minutes = ackedAt
        ? (new Date(ackedAt) - new Date(escalation.created_at)) / 60000
        : null;

    return {
        id: escalation.id,
        title: escalation.title,
        status: escalation.status,
        statusState: escalation.status,
        priority: escalation.priority ? escalation.priority.name : null,
        escalationPathId: escalation.escalation_path_id || null,
        creator: creatorName(escalation.creator),
        created_at: escalation.created_at,
        updated_at: escalation.updated_at,
        acknowledgedAt: ackedAt,
        acknowledgedBy: ack ? names(ack.users, "name") : [],
        timeToAckMinutes: minutes,
        relatedIncidents: names(escalation.related_incidents, "name"),
        relatedAlerts: names(escalation.related_alerts, "title"),
        description: escalation.description || null,
    };
});
