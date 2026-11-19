// dataStreams/scripts/catalogEntries.js
// One row per live entry of the catalog type being read. Entry names repeat across
// types (a "payments" service and a "payments" repository), so qualifiedName adds the
// type to keep imported objects distinguishable in pickers.
const type = context.objects[0];
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const typeName = unwrap(type.name);

result = (data.catalog_entries || [])
    .filter((entry) => !entry.archived_at)
    .map((entry) => ({
        id: entry.id,
        name: entry.name,
        qualifiedName: typeName + " / " + entry.name,
        catalogTypeId: entry.catalog_type_id,
        catalogTypeName: typeName,
        externalId: entry.external_id || null,
        aliases: entry.aliases || [],
        updated_at: entry.updated_at || null,
    }));
