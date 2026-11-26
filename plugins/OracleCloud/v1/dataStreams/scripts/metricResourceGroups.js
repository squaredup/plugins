// Resource groups only exist for some custom metrics; offer the distinct ones.
result = _.uniq((Array.isArray(data) ? data : []).map((m) => m.resourceGroup).filter(Boolean))
    .sort()
    .map((rg) => ({ label: rg, value: rg }));
