// Stamps the account id from the scoped object onto every row so the Access
// analytics stream can build its account-scoped GraphQL query.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((app) => ({
    sourceId: app.id || app.uid,
    appName: app.name,
    accountId: accountId,
    domain: app.domain || "",
    appType: app.type || "",
    sessionDuration: app.session_duration || "",
    appLauncherVisible: Boolean(app.app_launcher_visible),
    createdOn: app.created_at,
    modifiedOn: app.updated_at,
}));
