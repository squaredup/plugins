const rows = data.incidents || [];

result = rows.map((i) => ({
    id: i.id,
    incidentNumber: i.incident_number,
    title: i.title,
    status: i.status,
    urgency: i.urgency,
    priorityName: i.priority ? i.priority.summary : "",
    serviceId: i.service ? i.service.id : "",
    serviceName: i.service ? i.service.summary : "",
    escalationPolicyName: i.escalation_policy ? i.escalation_policy.summary : "",
    teamNames: (i.teams || []).map((t) => t.summary).join(", "),
    assigneeNames: (i.assignments || [])
        .map((a) => a.assignee && a.assignee.summary)
        .filter(Boolean)
        .join(", "),
    createdAt: i.created_at,
    lastStatusChangeAt: i.last_status_change_at,
    resolvedAt: i.resolved_at || "",
    htmlUrl: i.html_url,
}));
