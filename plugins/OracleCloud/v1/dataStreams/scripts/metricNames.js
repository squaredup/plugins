// Distinct metric names in the namespace, repeated once per compartment otherwise.
result = _.uniq((Array.isArray(data) ? data : []).map((m) => m.name).filter(Boolean))
    .sort()
    .map((name) => ({ label: name, value: name }));
