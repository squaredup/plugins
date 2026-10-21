// TANSS returns referenced entities' names in meta.linkedEntities. The exact shape is
// unverified, so accept both id-keyed maps and arrays, and fall back to the raw id.
const lookup = (key) => {
    const raw = data?.meta?.linkedEntities?.[key];
    return Array.isArray(raw) ? _.keyBy(raw, 'id') : raw || {};
};
const companies = lookup('companies');
const employees = lookup('employees');
const states = lookup('ticketStates');
const types = lookup('ticketTypes');

const nameOf = (table, id) => (id ? table[id]?.name || String(id) : null);
// TANSS dates are unix seconds; 0 means "not set"
const toIso = (v) => (typeof v === 'number' && v > 0 ? new Date(v * 1000).toISOString() : null);
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selectedIds = (param) => new Set((context.config?.[param] || []).map((o) => String(unwrap(o.rawId))));

const companyIds = selectedIds('company');
const technicianIds = selectedIds('technician');
const tickets = Array.isArray(data?.content) ? data.content : [];

result = tickets
    .filter((t) => !companyIds.size || companyIds.has(String(t.companyId)))
    .filter((t) => !technicianIds.size || technicianIds.has(String(t.assignedToEmployeeId)))
    .map((t) => ({
        ticketId: String(t.id),
        title: t.title,
        statusId: t.statusId ? String(t.statusId) : null,
        statusName: nameOf(states, t.statusId),
        typeId: t.typeId ? String(t.typeId) : null,
        typeName: nameOf(types, t.typeId),
        companyId: t.companyId ? String(t.companyId) : null,
        companyName: t.companyId ? companies[t.companyId]?.name || `Company ${t.companyId}` : null,
        technicianId: t.assignedToEmployeeId ? String(t.assignedToEmployeeId) : null,
        technicianName: t.assignedToEmployeeId ? nameOf(employees, t.assignedToEmployeeId) : 'Unassigned',
        createdAt: toIso(t.date),
        deadline: toIso(t.deadlineDate),
        dueDate: toIso(t.dueDate),
        estimatedMinutes: typeof t.estimatedMinutes === 'number' ? t.estimatedMinutes : null,
        isProject: Boolean(t.project),
        isRepair: Boolean(t.repair)
    }));
