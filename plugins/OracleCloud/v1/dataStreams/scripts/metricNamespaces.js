// listMetrics grouped by namespace can still repeat a namespace once per
// compartment, so de-duplicate before offering the list.
result = _.uniq((Array.isArray(data) ? data : []).map((m) => m.namespace).filter(Boolean))
    .sort()
    .map((ns) => ({ label: ns, value: ns }));
