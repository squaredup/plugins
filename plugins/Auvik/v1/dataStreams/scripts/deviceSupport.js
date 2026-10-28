const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (name) =>
    new Set(((context.config && context.config[name]) || []).map((o) => unwrap(o.rawId)).filter(Boolean));
const rel = (item, name) => (item.relationships && item.relationships[name] && item.relationships[name].data) || null;
const relAttr = (item, name, attr) => {
    const d = rel(item, name);
    return (d && ((d.attributes && d.attributes[attr]) || d[attr])) || null;
};
const items = Array.isArray(data && data.data) ? data.data : data && data.data ? [data.data] : [];
const deviceFilter = selected("device");
const lifecycle = context.config && context.config.coverage === "lifecycle";
const now = Date.now();

result = items
    .map((d) => {
        const a = d.attributes || {};
        // Warranty records are keyed by device id; lifecycle records reference the device.
        const deviceId = (rel(d, "device") || {}).id || d.id;
        const base = {
            deviceId,
            deviceName: a.deviceName || relAttr(d, "device", "deviceName") || deviceId,
            coverage: lifecycle ? "lifecycle" : "warranty",
            tenantId: (rel(d, "tenant") || {}).id || null,
            tenantName: relAttr(d, "tenant", "domainPrefix"),
        };
        if (lifecycle) {
            return {
                ...base,
                salesAvailability: a.salesAvailability || null,
                softwareMaintenanceStatus: a.softwareMaintenanceStatus || null,
                securitySoftwareMaintenanceStatus: a.securitySoftwareMaintenanceStatus || null,
                lastSupportStatus: a.lastSupportStatus || null,
            };
        }
        const expires = a.warrantyExpirationDate ? Date.parse(a.warrantyExpirationDate) : NaN;
        return {
            ...base,
            warrantyCoverageStatus: a.warrantyCoverageStatus || null,
            warrantyExpirationDate: a.warrantyExpirationDate || null,
            daysUntilWarrantyExpiry: Number.isNaN(expires) ? null : Math.floor((expires - now) / 86400000),
            serviceCoverageStatus: a.serviceCoverageStatus || null,
            serviceAttachmentStatus: a.serviceAttachmentStatus || null,
            contractRenewalAvailability: a.contractRenewalAvailability || null,
            recommendedSoftwareVersion: a.recommendedSoftwareVersion || null,
        };
    })
    .filter((r) => !deviceFilter.size || deviceFilter.has(r.deviceId));

// Auvik only holds records for devices it has matched to vendor data, and the single-device
// endpoint 404s for the rest, so the list is always fetched and filtered here. A selected device
// without a record still gets a row, so a per-device tile says so rather than showing no data.
const reported = new Set(result.map((r) => r.deviceId));
for (const o of (context.config && context.config.device) || []) {
    const deviceId = unwrap(o.rawId);
    if (!deviceId || reported.has(deviceId)) continue;
    const statuses = lifecycle
        ? ["salesAvailability", "softwareMaintenanceStatus", "securitySoftwareMaintenanceStatus", "lastSupportStatus"]
        : ["warrantyCoverageStatus", "serviceCoverageStatus"];
    result.push({
        deviceId,
        deviceName: unwrap(o.name) || deviceId,
        coverage: lifecycle ? "lifecycle" : "warranty",
        tenantId: unwrap(o.tenantId) || null,
        tenantName: unwrap(o.tenantName) || null,
        ...Object.fromEntries(statuses.map((k) => [k, "Not reported"])),
    });
}
