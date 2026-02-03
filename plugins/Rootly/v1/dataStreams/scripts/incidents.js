result = data.data.map((i) => ({
    id: i.attributes.sequential_id,
    title: i.attributes.title,
    status: i.attributes.status,
    url: i.attributes.url,
    user: i.attributes.user?.data?.attributes?.full_name,
    slug: i.attributes.severity.data.attributes.name,
    severity: i.attributes.severity.data.attributes.severity,
    description: i.attributes.severity.data.attributes.description,
    started_at: i.attributes.started_at,
    detected_at: i.attributes.detected_at,
    acknowledged_at: i.attributes.acknowledged_at,
    mitigated_at: i.attributes.mitigated_at,
    resolved_at: i.attributes.resolved_at,
    closed_at: i.attributes.closed_at,
    cancelled_at: i.attributes.cancelled_at,
    created_at: i.attributes.created_at,
    updated_at: i.attributes.updated_at
}));
