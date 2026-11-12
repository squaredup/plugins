// GraphQL returns { data: { rack_list: [ { id, name, u_height, starting_unit, site, location, devices: [...] } ] } }.
// Occupancy is computed per rack from every positioned device, in half-unit steps (position and height can be .5).
// A device occupies the slots [position, position + height). Slots are unioned across both faces, so a half-depth
// device on the front and another on the rear at the same U count once, and a full-depth device counts once.
// GraphQL reports query errors with HTTP 200 and an `errors` array (errorHandling does not fire on a 200), so surface them here.
if (data && Array.isArray(data.errors) && data.errors.length) {
    throw new Error(data.errors.map((e) => e.message).filter(Boolean).join("; "));
}
const racks = (data && data.data && data.data.rack_list) || [];

const num = (v) => (v === null || typeof v === "undefined" || v === "" ? null : Number(v));
const round = (v, dp) => Math.round(v * 10 ** dp) / 10 ** dp;
const faceOf = (d) => String(d.face || "").toLowerCase();

result = racks.map((rack) => {
    const uHeight = num(rack.u_height) || 0;
    const startingUnit = num(rack.starting_unit) || 1;
    // Slots are half-units, so unit U maps to slot index U * 2. The rack spans [lo, hi).
    const lo = startingUnit * 2;
    const hi = lo + uHeight * 2;

    const both = new Set();
    const front = new Set();
    const rear = new Set();
    let deviceCount = 0;

    (rack.devices || []).forEach((d) => {
        const position = num(d.position);
        if (position === null) return; // child devices (in bays) and unracked devices have no position
        deviceCount++;

        const type = d.device_type || {};
        const height = num(type.u_height) || 0; // 0U devices occupy no space
        const start = Math.round(position * 2);
        const end = start + Math.round(height * 2);
        const fullDepth = type.is_full_depth !== false;
        const face = faceOf(d);

        for (let s = Math.max(start, lo); s < Math.min(end, hi); s++) {
            both.add(s);
            if (fullDepth || face === "front") front.add(s);
            if (fullDepth || face === "rear") rear.add(s);
        }
    });

    const usedUnits = both.size / 2;
    return {
        rack: rack.name,
        site: rack.site && rack.site.name,
        location: (rack.location && rack.location.name) || "",
        uHeight,
        usedUnits,
        availableUnits: Math.max(uHeight - usedUnits, 0),
        utilization: uHeight ? round((usedUnits / uHeight) * 100, 1) : 0,
        frontUsed: front.size / 2,
        rearUsed: rear.size / 2,
        deviceCount,
        rackId: rack.id,
    };
});
