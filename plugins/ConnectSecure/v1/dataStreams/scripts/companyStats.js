// dataStreams/scripts/companyStats.js
// Offset paging aggregates every page into the same response shape before this
// script runs, so `data.data` is the full list of company stats records across all pages.
const records = (data && data.data) || [];

// Optional `company` object-picker parameter (stream `ui` name "company").
// Selected objects arrive at context.config.company as an ARRAY (multi-select),
// each rawId a single-element array. Empty/absent => no filter, return everything.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.company) || [];
const companyIds = new Set(
    selected.map((o) => unwrap(o.rawId)).filter(Boolean),
);

// company_id in the raw API data is a NUMBER; rawId is always a STRING.
const scoped = companyIds.size
    ? records.filter((r) => companyIds.has(String(r.company_id)))
    : records;

result = scoped;
