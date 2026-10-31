// The enterprise endpoint returns the seat in the seat-list shape ({ seats: [...] }); the organization one returns it bare
const seats = Array.isArray(data?.seats) ? data.seats : data ? [data] : [];

result = seats.map((s) => ({
    'assignee.id': s.assignee?.id ?? null,
    'assignee.login': s.assignee?.login ?? null,
    'assignee.name': s.assignee?.name ?? null,
    plan_type: s.plan_type ?? null,
    'organization.login': s.organization?.login ?? null,
    'assigning_team.name': s.assigning_team?.name ?? null,
    created_at: s.created_at ?? null,
    last_activity_at: s.last_activity_at ?? null,
    last_activity_editor: s.last_activity_editor ?? null,
    last_authenticated_at: s.last_authenticated_at ?? null,
    pending_cancellation_date: s.pending_cancellation_date ?? null
}));
