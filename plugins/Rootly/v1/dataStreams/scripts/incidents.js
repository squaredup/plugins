const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const related = (list) => (list || []).map((r) => r.data ?? r).filter(Boolean);

// Filtered here by ID rather than with Rootly's filter[services] etc., which aren't documented as taking IDs.
const selectedIds = new Set((context.config.catalogItems || []).map((o) => unwrap(o.rawId)));

result = data.data
    .map((i) => {
        const services = related(i.attributes.services);
        const teams = related(i.attributes.groups);
        const functionalities = related(i.attributes.functionalities);
        const environments = related(i.attributes.environments);
        return {
            linkedIds: [...services, ...teams, ...functionalities, ...environments].map((r) => r.id),
            row: {
                id: i.attributes.sequential_id,
                title: i.attributes.title,
                status: i.attributes.status,
                url: i.attributes.url,
                user: i.attributes.user?.data?.attributes?.full_name,
                slug: i.attributes.severity?.data?.attributes?.name,
                severity: i.attributes.severity?.data?.attributes?.severity,
                description: i.attributes.severity?.data?.attributes?.description,
                services: services.map((r) => r.attributes?.name),
                teams: teams.map((r) => r.attributes?.name),
                functionalities: functionalities.map((r) => r.attributes?.name),
                environments: environments.map((r) => r.attributes?.name),
                started_at: i.attributes.started_at,
                detected_at: i.attributes.detected_at,
                acknowledged_at: i.attributes.acknowledged_at,
                mitigated_at: i.attributes.mitigated_at,
                resolved_at: i.attributes.resolved_at,
                closed_at: i.attributes.closed_at,
                cancelled_at: i.attributes.cancelled_at,
                created_at: i.attributes.created_at,
                updated_at: i.attributes.updated_at
            }
        };
    })
    .filter((x) => selectedIds.size === 0 || x.linkedIds.some((id) => selectedIds.has(id)))
    .map((x) => x.row);
