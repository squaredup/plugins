// The statistics response shape is unverified: accept either an array of
// per-employee rows or an object keyed by employee id.
const content = data?.content;
const rows = Array.isArray(content)
    ? content
    : Object.entries(content || {}).map(([employeeId, stats]) => ({ employeeId, ...stats }));
const names = Object.fromEntries((context.objects || []).map((o) => [String(o.rawId), o.name]));

result = rows.map(({ employeeId, ...stats }) => ({
    technicianId: String(employeeId),
    technicianName: names[String(employeeId)] || `Technician ${employeeId}`,
    ...stats
}));
