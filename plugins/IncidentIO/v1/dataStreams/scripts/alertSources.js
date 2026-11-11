// dataStreams/scripts/alertSources.js
// Builds an explicit allow-list of columns. The raw alert source carries
// `secret_token` and `alert_events_url` (the ingest URL, which embeds a
// credential); neither may reach the graph or the tile editor.
result = (data.alert_sources || []).map((source) => ({
    id: source.id,
    name: source.name,
    sourceType: source.source_type,
    owningTeamIds: source.owning_team_ids || [],
    autoResolveTimeoutMinutes: source.auto_resolve_timeout_minutes,
    autoResolveIncidentAlerts: source.auto_resolve_incident_alerts,
}));
