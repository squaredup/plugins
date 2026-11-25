// Keep only READY subscriptions, then apply the optional "Regions to import"
// filter from the data source configuration (empty = every subscribed region).
const selected = {{ JSON.stringify((Array.isArray(dataSource.regions) ? dataSource.regions : []).map((r) => (r && r.value) || r).filter(Boolean)) }};

result = (Array.isArray(data) ? data : [])
    .filter((r) => r.status === "READY")
    .filter((r) => selected.length === 0 || selected.includes(r.regionName));
