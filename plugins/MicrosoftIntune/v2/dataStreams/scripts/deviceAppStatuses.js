// One row per app targeted at the scoped managed device. The response is a single mobileAppIntentAndState
// entity whose mobileAppList holds the apps, so the list is flattened here. Body handling copes with a string body.
const entity = (typeof data === "string" ? JSON.parse(data.replace(/^\uFEFF/, "") || "{}") : data) || {};
const device = (context.objects && context.objects[0]) || {};

// Sort order for tiles: problems first. The state column sorts on its raw value, which would put "failed" first
// but "installed" before "pendingInstall" and "unknown".
const RANK = { failed: 0, uninstallFailed: 1, pendingInstall: 2, notInstalled: 3, unknown: 4, notApplicable: 5, installed: 6 };

// Readable labels for the documented mobileAppIntent values; anything new falls through unchanged.
const INTENT = {
    requiredInstall: "Required",
    requiredUninstall: "Uninstall",
    requiredAndAvailableInstall: "Required and available",
    available: "Available",
    availableInstallWithoutEnrollment: "Available without enrollment",
    notAvailable: "Not available",
    exclude: "Excluded"
};

result = (entity.mobileAppList || []).map((a) => ({
    installState: a.installState || null,
    statusRank: a.installState in RANK ? RANK[a.installState] : 4,
    appName: a.displayName || null,
    // Lower-cased to match the rawId of imported App objects.
    appId: a.applicationId ? String(a.applicationId).toLowerCase() : null,
    // Some app types (e.g. the Microsoft 365 apps suite) report an empty version.
    appVersion: a.displayVersion || null,
    intent: INTENT[a.mobileAppIntent] || a.mobileAppIntent || null,
    deviceName: device.name || null,
    deviceId: device.rawId || entity.managedDeviceIdentifier || null
}));
