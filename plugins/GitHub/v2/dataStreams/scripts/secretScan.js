const selectedRepo = '{{typeof repos !== "undefined" && repos.length > 0 ? repos[0].name : ""}}';
result = data.map((alert) => ({
    created_at: alert.created_at,
    html_url: alert.html_url,
    number: alert.number,
    publicly_leaked: alert.publicly_leaked,
    repo: alert.repository?.name ?? selectedRepo,
    resolution: alert.resolution,
    resolved_at: alert.resolved_at,
    resolved_by_login: alert.resolved_by?.login ?? null,
    secret_type: alert.secret_type,
    secret_type_display_name: alert.secret_type_display_name,
    state: alert.state,
    updated_at: alert.updated_at,
    validity: alert.validity,
}));
