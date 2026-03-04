const selectedRepo = '{{typeof repos !== "undefined" && repos.length > 0 ? repos[0].name : ""}}';
result = data.map((alert) => ({
    created_at: alert.created_at,
    fixed_at: alert.fixed_at,
    html_url: alert.html_url,
    number: alert.number,
    repo: alert.repository?.name ?? selectedRepo,
    rule_description: alert.rule?.description ?? null,
    rule_security_severity_level: alert.rule?.security_severity_level ?? null,
    state: alert.state,
    tool_name: alert.tool?.name ?? null,
    updated_at: alert.updated_at,
}));
