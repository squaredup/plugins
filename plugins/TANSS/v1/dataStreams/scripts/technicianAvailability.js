// The availability response shape is unverified: accept either an array of
// per-employee rows or an object keyed by employee id.
const content = data?.content;
const rows = Array.isArray(content)
    ? content
    : Object.entries(content || {}).map(([employeeId, availability]) =>
          typeof availability === 'object' ? { employeeId, ...availability } : { employeeId, availability }
      );
const names = Object.fromEntries((context.objects || []).map((o) => [String(o.rawId), o.name]));

result = rows.map(({ employeeId, ...availability }) => ({
    technicianId: String(employeeId),
    technicianName: names[String(employeeId)] || `Technician ${employeeId}`,
    ...availability
}));
