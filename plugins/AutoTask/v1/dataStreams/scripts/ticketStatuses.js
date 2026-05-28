const statusField = data.fields.find(f => f.name === "status");
const values = statusField ? statusField.picklistValues : [];
result = values
    .filter(pv => pv.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(pv => ({ id: String(pv.value), name: pv.label }));
