const priorityField = data.fields.find(f => f.name === "priority");
const values = priorityField ? priorityField.picklistValues : [];
result = values
    .filter(pv => pv.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(pv => ({ id: String(pv.value), name: pv.label }));
