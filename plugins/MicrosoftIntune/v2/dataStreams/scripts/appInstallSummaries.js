// One row per app from the tenant-wide app install status report. The Intune report returns
// { Schema: [{ Column }], Values: [[...]] }, so each Values row is zipped with the column names. If the body
// arrives as a string (non-JSON content type), parse it, dropping any BOM. Runs once per page, so it only maps rows.
const report = (typeof data === "string" ? JSON.parse(data.replace(/^﻿/, "") || "{}") : data) || {};
const columns = (report.Schema || []).map((s) => s.Column);

const count = (value) => (typeof value === "number" ? value : 0);

// Sort order for tiles: problems first. The state column sorts on its raw value, which would put "success" before
// "unknown" and "warning".
const RANK = { error: 0, warning: 1, unknown: 2, success: 3 };

result = (report.Values || [])
    .map((values) => _.zipObject(columns, values))
    .map((r) => {
        const failed = count(r.FailedDeviceCount);
        const pending = count(r.PendingInstallDeviceCount);
        const installed = count(r.InstalledDeviceCount);
        const notInstalled = count(r.NotInstalledDeviceCount);
        const notApplicable = count(r.NotApplicableDeviceCount);
        // An app with every device count at zero has no install status reported (unassigned, or available only).
        const state =
            failed > 0
                ? "error"
                : pending > 0
                  ? "warning"
                  : installed + notInstalled + notApplicable === 0
                    ? "unknown"
                    : "success";
        return {
            state,
            statusRank: RANK[state],
            appName: r.DisplayName || null,
            // Lower-cased to match the rawId of imported App objects.
            appId: r.ApplicationId ? String(r.ApplicationId).toLowerCase() : null,
            publisher: r.Publisher || null,
            platform: r.AppPlatform || null,
            // Store, VPP and Microsoft 365 apps report an empty version.
            appVersion: r.AppVersion || null,
            installedDeviceCount: installed,
            failedDeviceCount: failed,
            pendingInstallDeviceCount: pending,
            notInstalledDeviceCount: notInstalled,
            notApplicableDeviceCount: notApplicable,
            failedDevicePercentage: typeof r.FailedDevicePercentage === "number" ? r.FailedDevicePercentage : null,
            installedUserCount: count(r.InstalledUserCount),
            failedUserCount: count(r.FailedUserCount),
            pendingInstallUserCount: count(r.PendingInstallUserCount),
            notInstalledUserCount: count(r.NotInstalledUserCount),
            notApplicableUserCount: count(r.NotApplicableUserCount)
        };
    });
