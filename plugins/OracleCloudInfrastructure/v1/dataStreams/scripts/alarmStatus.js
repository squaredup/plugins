// Alarm status rows carry no region, because each request only covers the region it
// was sent to. Add the region from the Region object this request was scoped to.
const region = context.objects?.[0]?.rawId;

result = (Array.isArray(data) ? data : []).map((alarm) => ({ ...alarm, region }));
