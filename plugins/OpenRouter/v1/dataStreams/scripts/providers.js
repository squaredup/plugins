// Flattens the datacenters country-code array into a comma-separated string
// so it can be shown in tables and indexed as a Provider property.
result = (data?.data ?? []).map((p) => ({ ...p, datacenters: (p.datacenters ?? []).join(', ') }));
