// Errors from streams that call the Microsoft Defender for Endpoint API through an "mde/" path.
// Data sources added before this API was supported keep their original saved settings, which
// have no pre-request script, so their "mde/" requests reach Microsoft Graph instead.
const error = (data && data.error) || {};
const apiMessage = typeof error.message === "string" ? error.message : "";

if (apiMessage.includes("segment 'mde'")) {
    result =
        "This data source was added before vulnerability data was supported. " +
        "Edit the data source and save it to enable vulnerability data.";
} else if (response.status === 401 || response.status === 403) {
    result =
        "The app cannot read vulnerabilities from the Microsoft Defender for Endpoint API (HTTP " +
        response.status +
        "). Grant the WindowsDefenderATP 'Vulnerability.Read.All' application permission with admin consent. " +
        "This needs a licence with vulnerability management, such as Microsoft Defender for Business or " +
        "Microsoft Defender for Endpoint Plan 2.";
} else {
    result = apiMessage || "The Microsoft Defender for Endpoint API returned HTTP " + response.status;
}
