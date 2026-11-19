// dataStreams/scripts/catalogTypeOptions.js
// Options for the Catalog types to index setting. Team types are left out, because
// teams are already imported as Team objects. catalogTypes.js matches the chosen
// values against each type's name, so the value is the name.
result = (data.catalog_types || [])
    .filter((type) => !type.is_team_type && type.name)
    .map((type) => ({ value: type.name, label: type.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
