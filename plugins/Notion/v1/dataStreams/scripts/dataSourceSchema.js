// dataStreams/scripts/dataSourceSchema.js
// data is the single data source object: { id, title, properties: { <PropName>: { id, name, type, ... } } }
// Iterate properties (object keyed by property name) → one row per property.

result = Object.values(data.properties || {}).map(function (prop) {
    var details = "";
    var typeConfig = prop[prop.type];

    if (prop.type === "select" || prop.type === "multi_select") {
        var options = typeConfig && typeConfig.options ? typeConfig.options : [];
        details = options.map(function (o) { return o.name; }).join(", ");
    } else if (prop.type === "relation") {
        details = (typeConfig && typeConfig.database_id) ? typeConfig.database_id : "";
    }

    return {
        name: prop.name,
        type: prop.type,
        details: details
    };
});
