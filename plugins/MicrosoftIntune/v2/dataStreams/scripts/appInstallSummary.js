// One summary row for the scoped app. The Intune report returns { Schema: [{ Column }], Values: [[...]] }, so the
// single Values row is zipped with the column names. If the body arrives as a string (non-JSON content type), parse
// it, dropping any BOM. An app with no install status records returns no Values, so its counts are zero and its
// state is unknown.
const report = (typeof data === "string" ? JSON.parse(data.replace(/^﻿/, "") || "{}") : data) || {};
const columns = (report.Schema || []).map((s) => s.Column);
const values = (report.Values || [])[0];
const r = values ? _.zipObject(columns, values) : {};
const app = context.objects[0];
const count = (name) => (typeof r[name] === "number" ? r[name] : 0);

const failed = count("FailedDeviceCount");
const pending = count("PendingInstallDeviceCount");
const installed = count("InstalledDeviceCount");
const notInstalled = count("NotInstalledDeviceCount");
const notApplicable = count("NotApplicableDeviceCount");

let state = "success";
if (failed > 0) {
    state = "error";
} else if (pending > 0) {
    state = "warning";
} else if (installed + notInstalled + notApplicable === 0) {
    state = "unknown";
}

result = [
    {
        state,
        appName: app.name,
        appId: app.rawId,
        installedDeviceCount: installed,
        failedDeviceCount: failed,
        pendingInstallDeviceCount: pending,
        notInstalledDeviceCount: notInstalled,
        notApplicableDeviceCount: notApplicable,
        installedUserCount: count("InstalledUserCount"),
        failedUserCount: count("FailedUserCount"),
        pendingInstallUserCount: count("PendingInstallUserCount"),
        notInstalledUserCount: count("NotInstalledUserCount"),
        notApplicableUserCount: count("NotApplicableUserCount")
    }
];
