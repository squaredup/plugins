const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

// Rootly returns an incident's linked catalog items as IDs under `relationships`, with the records themselves in `included`.
const included = new Map((data.included || []).map((r) => [`${r.type}:${r.id}`, r]));
const related = (incident, key) =>
    (incident.relationships?.[key]?.data || []).map((r) => ({
        id: r.id,
        name: included.get(`${r.type}:${r.id}`)?.attributes?.name
    }));

// Filtered here by ID rather than with Rootly's filter[services] etc., which aren't documented as taking IDs.
const selectedIds = new Set((context.config.catalogItems || []).map((o) => unwrap(o.rawId)));

result = data.data
    .map((i) => {
        const services = related(i, 'services');
        const teams = related(i, 'groups');
        const functionalities = related(i, 'functionalities');
        const environments = related(i, 'environments');
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
                services: services.map((r) => r.name),
                teams: teams.map((r) => r.name),
                functionalities: functionalities.map((r) => r.name),
                environments: environments.map((r) => r.name),
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
