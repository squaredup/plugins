// Routes are the join object between a Worker and the Zone it serves, so this
// stamps both sides' keys onto each row: zoneId from the scoped Zone object and
// scriptName from the route itself. A correlation Bridge rule then relates
// Worker -> Worker Route -> Zone. Routes with no script attached are dropped -
// they cannot participate in that relationship.
const zone = (context.objects && context.objects[0]) || {};
const zoneId = zone.rawId || "";
const zoneName = zone.name || "";
// Graph properties can arrive as single-element arrays, so unwrap before use.
// accountId scopes the Worker Route -> Worker correlation to one account: two
// accounts can each hold a Worker with the same name.
const accountId = [].concat(zone.accountId || "")[0] || "";

result = ((data && data.result) || [])
    .filter((route) => route && route.script)
    .map((route) => ({
        sourceId: route.id,
        pattern: route.pattern,
        zoneId: zoneId,
        zoneName: zoneName,
        accountId: accountId,
        scriptName: route.script,
    }));
