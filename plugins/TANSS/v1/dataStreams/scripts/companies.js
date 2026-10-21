// TANSS has no GET endpoint that lists all companies (only a PUT search, which
// WebAPI can't send), so companies are derived from the tickets assigned to technicians.
// List responses carry names for referenced ids in meta.linkedEntities; its shape is
// unverified, so both id-keyed maps and arrays are accepted.
const linked = data?.meta?.linkedEntities?.companies;
const companies = Array.isArray(linked) ? _.keyBy(linked, 'id') : linked || {};
const tickets = Array.isArray(data?.content) ? data.content : [];

result = _.uniqBy(
    tickets.filter((t) => t.companyId),
    'companyId'
).map((t) => ({
    companyId: String(t.companyId),
    companyName: companies[t.companyId]?.name || `Company ${t.companyId}`
}));
