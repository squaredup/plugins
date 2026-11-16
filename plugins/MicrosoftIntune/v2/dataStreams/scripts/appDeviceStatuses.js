// One row per device install status record for the scoped app. The Intune report returns
// { Schema: [{ Column }], Values: [[...]] }, so each Values row is zipped with the column names. If the body
// arrives as a string (non-JSON content type), parse it, dropping any BOM. Runs once per page, so it only maps rows.
const report = (typeof data === "string" ? JSON.parse(data.replace(/^﻿/, "") || "{}") : data) || {};
const columns = (report.Schema || []).map((s) => s.Column);
const app = (context.objects && context.objects[0]) || {};

// The numeric InstallState is Graph's resultantAppState enum. Naming it from the code, rather than the localized
// AppInstallState_loc label, keeps the state values stable across tenant languages and matches Device App Statuses.
const STATE = { 1: "installed", 2: "failed", 3: "notInstalled", 4: "uninstallFailed", 5: "pendingInstall", 99: "unknown", "-1": "notApplicable" };

// Sort order for tiles: problems first. The state column sorts on its raw value, which would put "installed" before
// "pendingInstall" and "unknown".
const RANK = { failed: 0, uninstallFailed: 1, pendingInstall: 2, notInstalled: 3, unknown: 4, notApplicable: 5, installed: 6 };

// The report sends empty strings for unset text.
const text = (value) => (typeof value === "string" && value.trim() !== "" ? value : null);

// Report times are UTC but carry no zone designator.
const utc = (value) => (text(value) && !/(Z|[+-]\d\d:?\d\d)$/.test(value) ? value + "Z" : text(value));

result = (report.Values || [])
    .map((values) => _.zipObject(columns, values))
    .map((r) => {
        const installState = STATE[r.InstallState] || text(r.AppInstallState_loc) || "unknown";
        return {
            installState,
            statusRank: installState in RANK ? RANK[installState] : 4,
            deviceName: text(r.DeviceName),
            // Matches the rawId of imported Managed Device objects.
            deviceId: text(r.DeviceId) ? r.DeviceId.toLowerCase() : null,
            installStateDetail: text(r.AppInstallStateDetails_loc),
            errorCode: text(r.HexErrorCode),
            // Device-context records have an empty user principal name.
            userPrincipalName: text(r.UserPrincipalName),
            platform: text(r.Platform),
            appVersion: text(r.AppVersion),
            lastModifiedDateTime: utc(r.LastModifiedDateTime),
            appName: app.name || null,
            appId: app.rawId || null
        };
    });
