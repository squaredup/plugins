// Builds one row per rack unit (and per device covering it) from the GraphQL rack_list response.
// The GraphQL API returns Decimal fields (position, u_height) as strings such as "32.0".
// GraphQL reports errors as HTTP 200 with an `errors` array, so errorHandling never fires; throw to surface the message.
if (data && data.errors && data.errors.length) {
    throw new Error(data.errors.map((e) => e.message).join("; "));
}
const racks = (data && data.data && data.data.rack_list) || [];

// Optional role filter: autocomplete values arrive as [{ value }] (slug, or a custom typed name).
const roleFilter = new Set(
    ((context.config && context.config.role) || [])
        .map((r) => String(r && typeof r === "object" ? r.value : r).toLowerCase())
        .filter((r) => r && r !== "undefined"),
);
const hasRoleFilter = roleFilter.size > 0;
const matchesRole = (role) =>
    !hasRoleFilter ||
    (role && (roleFilter.has(String(role.slug).toLowerCase()) || roleFilter.has(String(role.name).toLowerCase())));

const unitRange = (lo, hi) => (lo === hi ? `${lo}` : `${lo}–${hi}`);

const rows = [];
let order = 0;

// Keep racks together, ordered by site then rack name.
const bySiteAndName = (a, b) =>
    ((a.site && a.site.name) || "").localeCompare((b.site && b.site.name) || "") ||
    String(a.name).localeCompare(String(b.name)) ||
    Number(a.id) - Number(b.id);

for (const rack of [...racks].sort(bySiteAndName)) {
    const startUnit = Number(rack.starting_unit) || 1;
    const height = Number(rack.u_height) || 0;
    const topUnit = startUnit + height - 1;
    const base = {
        rack: rack.name,
        site: (rack.site && rack.site.name) || "",
        rackId: String(rack.id),
    };

    // Split the rack's devices into those mounted at a position and the rest (0U, child devices, unracked).
    const mounted = [];
    const other = [];
    for (const dev of rack.devices || []) {
        if (!matchesRole(dev.role)) continue;
        const dt = dev.device_type || {};
        const info = {
            deviceId: String(dev.id),
            device: dev.name || "(unnamed)",
            role: (dev.role && dev.role.name) || "",
            deviceType: dt.model || "",
            manufacturer: (dt.manufacturer && dt.manufacturer.name) || "",
            deviceHeight: Number(dt.u_height) || 0,
            fullDepth: !!dt.is_full_depth,
            face: dev.face === "rear" ? "Rear" : "Front",
        };
        const pos = dev.position === null || dev.position === undefined ? null : Number(dev.position);
        if (pos !== null && !Number.isNaN(pos) && info.deviceHeight > 0) {
            // Whole units the device touches: a 0.5U device at 5.5 still occupies unit 5.
            info.lo = Math.floor(pos);
            info.hi = Math.max(Math.ceil(pos + info.deviceHeight) - 1, info.lo);
            mounted.push(info);
        } else {
            info.kind = dev.parent_bay ? "Child" : info.deviceHeight === 0 ? "0U" : "Unracked";
            other.push(info);
        }
    }

    // NetBox renders a descending rack (desc_units) with the starting unit at the top.
    const units = [];
    for (let i = 0; i < height; i++) units.push(rack.desc_units ? startUnit + i : topUnit - i);

    for (const unit of units) {
        const covering = mounted
            .filter((d) => d.lo <= unit && d.hi >= unit)
            .sort((a, b) => (a.fullDepth === b.fullDepth ? 0 : a.fullDepth ? -1 : 1) || (a.face === "Front" ? -1 : 1));
        if (!covering.length) {
            // An empty slot is only meaningful when not filtering by role.
            if (!hasRoleFilter) {
                rows.push({ ...base, order: order++, unit, unitsLabel: `${unit}`, device: "", deviceId: "", role: "", deviceType: "", manufacturer: "", face: "", deviceHeight: null, isTopUnit: false, occupied: false });
            }
            continue;
        }
        for (const d of covering) {
            rows.push({
                ...base,
                order: order++,
                unit,
                unitsLabel: unitRange(d.lo, d.hi),
                device: d.device,
                deviceId: d.deviceId,
                role: d.role,
                deviceType: d.deviceType,
                manufacturer: d.manufacturer,
                face: d.fullDepth ? "Both" : d.face,
                deviceHeight: d.deviceHeight,
                isTopUnit: unit === (rack.desc_units ? d.lo : d.hi),
                occupied: true,
            });
        }
    }

    // 0U, child and unracked devices follow the units; they have no unit number.
    for (const d of other) {
        rows.push({
            ...base,
            order: order++,
            unit: null,
            unitsLabel: d.kind,
            device: d.device,
            deviceId: d.deviceId,
            role: d.role,
            deviceType: d.deviceType,
            manufacturer: d.manufacturer,
            face: "",
            deviceHeight: d.deviceHeight,
            isTopUnit: false,
            occupied: true,
        });
    }
}

result = rows;
