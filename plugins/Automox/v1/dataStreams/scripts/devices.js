// dataStreams/scripts/devices.js
//
// Return only the columns the stream declares. /servers sends ~55 fields per
// device (server_policies, patches, compatibility_checks, commands, ...), and
// carrying them forward capped a tile at ~1,000-1,500 devices and pushed a
// 500-device import page over the ~6MB response limit.
//
// deviceStatus/policyIds/deviceTags are derived here because a valueExpression
// only sees a json column's stringified value, not the live object.
const KEEP = [
    "uuid",
    "id",
    "display_name",
    "custom_name",
    "name",
    "os_family",
    "os_name",
    "os_version",
    "agent_version",
    "connected",
    "compliant",
    "needs_attention",
    "needs_reboot",
    "server_group_id",
    "organization_id",
    "ip_addrs",
    "serial_number",
    "last_refresh_time",
    "last_disconnect_time",
    "next_patch_time",
    "create_time",
    "pending_patches",
    "patch_deferral_count",
];

const rows = Array.isArray(data) ? data : [];

result = rows.map((r) => {
    const row = {};
    for (const key of KEEP) {
        row[key] = r[key];
    }

    row.deviceStatus = (r.status || {}).device_status;
    row.policyIds = (r.policy_status || []).map((p) => p.policy_id);
    row.deviceTags = r.tags || [];

    return row;
});
