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
const dataResult = (root && root.Result) || {};

// SSC returns HTTP 200 even on error - the real status lives in the body.
if (dataResult.StatusCode !== "SUCCESS") {
    result = [];
} else {
    const satellites = dataResult.Data || [];
    const rows = [];

    for (const sat of satellites) {
        const coordBlock = (sat.Coordinates || [])[0];
        if (!coordBlock) {
            continue;
        }

        const times = sat.Time || [];
        const xs = coordBlock.X || [];
        const ys = coordBlock.Y || [];
        const zs = coordBlock.Z || [];

        for (let i = 0; i < times.length; i++) {
            rows.push({
                time: times[i],
                x: xs[i],
                y: ys[i],
                z: zs[i],
                coordinateSystem: coordBlock.CoordinateSystem || "",
            });
        }
    }

    result = rows;
}
