// quota.js — pivot the flat quota object into one row per resource.
// The API returns a single object with paired _limit/_usage fields.
// We iterate keys ending in _usage, find the matching _limit, and emit one row per pair.

const PRETTY = {
    instance_count: "Instances",
    cpu_core: "CPU Cores",
    ram_mb: "RAM (MB)",
    disk_gb: "Disk (GB)",
    disk_volume_count: "Disk Volumes",
    public_ip_address: "Public IP Addresses",
    network_count: "Networks",
    security_group: "Security Groups",
    security_group_rule: "Security Group Rules",
    subnet: "Subnets",
    port: "Ports",
    loadbalancer: "Load Balancers",
    objectstore_gb: "Object Store (GB)",
    database_count: "Databases",
    database_snapshot_count: "Database Snapshots",
};

function prettify(base) {
    if (PRETTY[base]) return PRETTY[base];
    // Fallback: replace underscores with spaces, title-case each word
    return base
        .split("_")
        .map(function (w) {
            return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(" ");
}

// Skip non-resource scalar fields
const SKIP_PREFIXES = ["id", "default_user", "cluster"];

var rows = [];

Object.keys(data).forEach(function (key) {
    if (!key.endsWith("_usage")) return;

    var base = key.slice(0, key.length - "_usage".length);

    // Skip identity/email/cluster fields
    for (var i = 0; i < SKIP_PREFIXES.length; i++) {
        if (base.indexOf(SKIP_PREFIXES[i]) === 0) return;
    }

    var usage = Number(data[key]);
    var limitKey = base + "_limit";
    var limit = Object.prototype.hasOwnProperty.call(data, limitKey) ? Number(data[limitKey]) : null;
    var percentUsed = (limit !== null && limit > 0) ? (usage / limit) * 100 : null;

    rows.push({
        resource: prettify(base),
        usage: usage,
        limit: limit,
        percentUsed: percentUsed,
    });
});

result = rows;
