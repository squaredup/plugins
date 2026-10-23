// Flattens the trigger's cron settings into scalar columns
result = (data.triggers || []).map((t) => ({
    id: t.trigger_id,
    name: t.name || t.trigger_id,
    kind: t.kind || null,
    status: t.status || null,
    schedule: t.cron?.cron_expr || null,
    timezone: t.cron?.timezone || null,
    nextRunAt: t.cron?.next_run_at || null,
    sessionMode: t.session_mode || null,
    boundSessionId: t.bound_session_id || null,
    createdAt: t.created_at,
    updatedAt: t.updated_at
}));
