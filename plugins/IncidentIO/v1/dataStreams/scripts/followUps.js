// dataStreams/scripts/followUps.js
// Flattens each follow-up, drops deleted ones, and applies the optional
// assignee filter (the API can filter by team but not by user). The API's team
// filter takes one team, so several selected teams are filtered here.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const users = (context.config && context.config.user) || [];
const userIds = users.map((u) => unwrap(u.rawId)).filter(Boolean);
const teamIds = ((context.config && context.config.team) || []).map((t) => unwrap(t.rawId)).filter(Boolean);
const stateOf = { outstanding: 'warning', completed: 'success', not_doing: 'unknown', deleted: 'unknown' };
const now = Date.now();

result = (data.follow_ups || [])
    .filter((f) => f.status !== 'deleted')
    .filter((f) => userIds.length === 0 || (f.assignee && userIds.includes(f.assignee.id)))
    .filter((f) => teamIds.length < 2 || (f.assignee_team && teamIds.includes(f.assignee_team.id)))
    .map((f) => {
        const start = Date.parse(f.created_at);
        const end = f.completed_at ? Date.parse(f.completed_at) : now;
        return {
            id: f.id,
            title: f.title,
            status: f.status,
            statusState: stateOf[f.status] || 'unknown',
            priority: f.priority ? f.priority.name : null,
            category: f.category ? f.category.name : null,
            assignee: f.assignee ? f.assignee.name : null,
            assigneeTeam: f.assignee_team ? f.assignee_team.name : null,
            incidentId: f.incident_id,
            labels: f.labels || [],
            created_at: f.created_at,
            completed_at: f.completed_at || null,
            updated_at: f.updated_at,
            ageDays: Number.isNaN(start) ? null : Math.max(0, (end - start) / 86400000),
        };
    });
