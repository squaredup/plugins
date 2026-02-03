result = data.map((row) => ({
    id: row.id,
    name: row.name,
    serviceTypes: row.serviceTypes.map((st) => st.name).join(', ')
}));