// Routes are the join object between a Worker and the Zone it serves, so this
// stamps both sides' keys onto each row: zoneId from the scoped Zone object and
// scriptName from the route itself. A correlation Bridge rule then relates
// Worker -> Worker Route -> Zone. Routes with no script attached are dropped -
// they cannot participate in that relationship.
const zone = (context.objects && context.objects[0]) || {};
const zoneId = zone.rawId || "";
const zoneName = zone.name || "";

result = ((data && data.result) || [])
    .filter((route) => route && route.script)
    .map((route) => ({
        sourceId: route.id,
        pattern: route.pattern,
        zoneId: zoneId,
        zoneName: zoneName,
        scriptName: route.script,
    }));
