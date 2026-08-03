// dataStreams/scripts/assets.js
// Paging aggregates every page into data.data before this script runs.
const rows = (data && data.data) || [];

// Optional `company` object-picker parameter (stream `ui` name "company").
// Selected objects arrive at context.config.company as an ARRAY (multi-select),
// each rawId a single-element array. Empty/absent -> no filter (all companies).
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.company) || [];
const companyIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

// company_id in the raw API data is a NUMBER; rawId is always a STRING.
const scoped = companyIds.size
    ? rows.filter((r) => companyIds.has(String(r.company_id)))
    : rows;

result = scoped.map((r) => ({
    id: r.id,
    name: r.name,
    host_name: r.host_name,
    ip: r.ip,
    domain: r.domain,
    platform: r.platform,
    system_type: r.system_type,
    os_name: r.os_name,
    os_version: r.os_version,
    agent_type: r.agent_type,
    asset_owner: r.asset_owner,
    company_id: r.company_id,
    importance: r.importance,
    hardware_model: r.hardware_model,
    manufacturer: r.manufacturer,
    last_discovered_time: r.last_discovered_time,
    created: r.created,
    updated: r.updated,
}));
