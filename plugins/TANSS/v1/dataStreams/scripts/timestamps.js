// The timestamps endpoint has no employee filter, so the optional technician
// selection is applied here. Field names other than id/employeeId/date are unverified.
const raw = data?.meta?.linkedEntities?.employees;
const employees = Array.isArray(raw) ? _.keyBy(raw, 'id') : raw || {};
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const technicianIds = new Set((context.config?.technician || []).map((o) => String(unwrap(o.rawId))));
const rows = Array.isArray(data?.content) ? data.content : [];

result = rows
    .filter((r) => !technicianIds.size || technicianIds.has(String(r.employeeId)))
    .map(({ id, employeeId, date, state, ...rest }) => ({
        ...rest,
        timestampId: String(id),
        time: typeof date === 'number' ? new Date(date * 1000).toISOString() : date,
        technicianId: employeeId ? String(employeeId) : null,
        technicianName: employees[employeeId]?.name || (employeeId ? `Technician ${employeeId}` : null),
        state
    }));
