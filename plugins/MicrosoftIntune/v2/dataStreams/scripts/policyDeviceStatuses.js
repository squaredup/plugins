// One row per device status record for the scoped policy. Runs once per page, so it only maps and filters rows.
// Graph rejects $filter on status (501 NotSupported), so unknown statuses are dropped here.
const policy = (context.objects && context.objects[0]) || {};
const config = context.config || {};
const includeUnknown = config.includeUnknown === true || config.includeUnknown === "true";

// Graph pads unset dates with 0001-01-01, and grace periods that never end with 9999-12-31.
const date = (value) =>
    typeof value === "string" && !value.startsWith("0001-") && !value.startsWith("9999-") ? value : null;

// Sort order for tiles: problems first. The status column sorts on its raw value, which would put "compliant" first.
const RANK = { error: 0, nonCompliant: 1, conflict: 2, inGracePeriod: 3, unknown: 4, notApplicable: 5, notAssigned: 6, remediated: 7, compliant: 8 };

// Status ids look like <tenant guid>_<policyId>_<managedDeviceId>; the last part is the managed device id.
const deviceIdFrom = (id) => {
    const parts = typeof id === "string" ? id.split("_") : [];
    return parts.length === 3 ? parts[2] : null;
};

result = ((data && data.value) || [])
    .filter((s) => includeUnknown || s.status !== "unknown")
    .map((s) => ({
        status: s.status,
        statusRank: s.status in RANK ? RANK[s.status] : 4,
        deviceName: s.deviceDisplayName || null,
        deviceId: deviceIdFrom(s.id),
        // Device-context records carry the literal user name "None" and an empty user principal name.
        userName: s.userName && s.userName !== "None" ? s.userName : null,
        userPrincipalName: s.userPrincipalName || null,
        lastReportedDateTime: date(s.lastReportedDateTime),
        gracePeriodExpirationDateTime: date(s.complianceGracePeriodExpirationDateTime),
        policyName: policy.name || null,
        policyId: policy.rawId || null
    }));
