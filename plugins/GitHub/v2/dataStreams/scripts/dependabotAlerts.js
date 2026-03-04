const selectedRepo = '{{typeof repos !== "undefined" && repos.length > 0 ? repos[0].name : ""}}';
result = data.map((alert) => ({
    created_at: alert.created_at,
    dependency_package_name: alert.dependency?.package?.name ?? null,
    html_url: alert.html_url,
    number: alert.number,
    repo: alert.repository?.name ?? selectedRepo,
    security_advisory_cve_id: alert.security_advisory?.cve_id ?? null,
    security_advisory_cvss_score: alert.security_advisory?.cvss?.score ?? null,
    security_advisory_severity: alert.security_advisory?.severity ?? null,
    security_advisory_summary: alert.security_advisory?.summary ?? null,
    state: alert.state,
    updated_at: alert.updated_at,
}));
