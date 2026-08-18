// Stamps the account id from the scoped object onto every row so downstream
// D1 analytics streams can build their account-scoped GraphQL query.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((db) => ({
    sourceId: db.uuid,
    databaseName: db.name,
    accountId: accountId,
    version: db.version || "",
    numTables: typeof db.num_tables === "number" ? db.num_tables : null,
    fileSize: typeof db.file_size === "number" ? db.file_size : null,
    createdOn: db.created_at,
}));
