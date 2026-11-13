// Errors from streams that call Microsoft Graph. The common failures are permission and licence
// gaps rather than faults, so name what is missing instead of passing on the raw Graph error.
const error = (data && data.error) || {};
let apiMessage = typeof error.message === "string" ? error.message : "";
// Intune's service backends wrap their reason in a JSON string; keep only its Message.
if (apiMessage.trim().startsWith("{")) {
    try {
        apiMessage = String(JSON.parse(apiMessage).Message || "").split(" - Operation ID")[0];
    } catch (e) {
        apiMessage = "";
    }
}

if (response.status === 401) {
    result =
        "Microsoft Graph rejected the credentials (HTTP 401). Check the tenant ID, client ID and client secret, " +
        "and that the secret has not expired.";
} else if (response.status === 403) {
    // Graph does not always name the missing role, so always list the read-only permissions.
    result =
        "Microsoft Graph refused access to this data (HTTP 403). Grant the missing application permission " +
        "with admin consent in Microsoft Entra ID, and check the tenant has an Intune licence." +
        (apiMessage ? " " + apiMessage : "") +
        " Read-only permissions are enough: devices need DeviceManagementManagedDevices.Read.All, " +
        "compliance policies and configuration profiles DeviceManagementConfiguration.Read.All, Autopilot, enrollment " +
        "and Apple push certificate or enrollment token data DeviceManagementServiceConfig.Read.All, Apple VPP tokens " +
        "DeviceManagementApps.Read.All, and users User.Read.All.";
} else if (response.status === 429) {
    result =
        "Microsoft Graph is limiting requests for this data (HTTP 429). Try again in a few minutes." +
        (apiMessage ? " " + apiMessage : "");
} else {
    result = apiMessage || "Microsoft Graph returned HTTP " + response.status;
}
