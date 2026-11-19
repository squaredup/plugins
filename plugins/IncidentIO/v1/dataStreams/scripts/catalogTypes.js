// dataStreams/scripts/catalogTypes.js
// Keeps only the catalog types named in the data source's catalogTypes setting
// (matched on name or type name, ignoring case). Team types are left out because
// teams are already imported as Team objects. With nothing chosen, nothing is imported.
const ds = (context.dataSources && context.dataSources[0]) || {};
const chosen = new Set(
    (ds.catalogTypes || [])
        .map((o) => String(o && o.value !== undefined ? o.value : o).trim().toLowerCase())
        .filter(Boolean),
);
const isChosen = (type) =>
    chosen.has(String(type.name || "").toLowerCase()) || chosen.has(String(type.type_name || "").toLowerCase());

result = (data.catalog_types || [])
    .filter((type) => !type.is_team_type && isChosen(type))
    .map((type) => ({
        id: type.id,
        name: type.name,
        typeName: type.type_name || null,
        description: type.description || null,
        estimatedCount: typeof type.estimated_count === "number" ? type.estimated_count : null,
    }));
