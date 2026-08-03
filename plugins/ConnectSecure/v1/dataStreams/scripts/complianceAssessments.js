const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.company) || [];
const companyIds = new Set(
    selected.map((o) => unwrap(o.rawId)).filter(Boolean),
);

const rows = data.data || [];
result = companyIds.size
    ? rows.filter((r) => companyIds.has(String(r.company_id)))
    : rows;
