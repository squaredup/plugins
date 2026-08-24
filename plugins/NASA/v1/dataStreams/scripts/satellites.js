// SSC wraps every JSON value as ["fully.qualified.ClassName", payload] (and arrays as
// ["java.util.ArrayList", [...]]), recursively. Strip that wrapper down to plain JSON.
function unwrap(node) {
    if (Array.isArray(node)) {
        if (node.length === 2 && typeof node[0] === "string" && node[0].indexOf(".") !== -1) {
            return unwrap(node[1]);
        }
        return node.map(unwrap);
    }
    if (node && typeof node === "object") {
        const out = {};
        for (const key of Object.keys(node)) {
            out[key] = unwrap(node[key]);
        }
        return out;
    }
    return node;
}

const root = unwrap(data);
const observatories = root.Observatory || [];
const now = Date.now();

result = observatories
    .filter(function (o) {
        return o.EndTime && new Date(o.EndTime).getTime() > now;
    })
    .map(function (o) {
        return {
            id: o.Id,
            name: o.Name,
            resolution: o.Resolution,
            startTime: o.StartTime,
            endTime: o.EndTime,
            resourceId: o.ResourceId || "",
        };
    });
