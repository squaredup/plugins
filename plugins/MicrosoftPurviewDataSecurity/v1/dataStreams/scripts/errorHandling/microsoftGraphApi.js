// Errors from Microsoft Graph. The common failures are permission and licence gaps rather than
// faults, so name what is missing instead of passing on the raw Graph error.
const error = (data && data.error) || {};
const apiMessage = typeof error.message === "string" ? error.message : "";

// Advanced hunting runs, but the tenant has no table or column of that name. That's usually a missing
// CloudAppEvents table (no Defender for Cloud Apps Microsoft 365 connector), or a typo in a custom query.
const missingTable = apiMessage.match(/Failed to resolve table or column expression named '([^']+)'/);

if (missingTable) {
    result =
        "Advanced hunting couldn't find the table or column '" +
        missingTable[1] +
        "'. If it's in your own query, check the name. CloudAppEvents needs the Microsoft Defender for Cloud Apps " +
        "Microsoft 365 app connector with its 'Microsoft 365 activities' component selected.";
} else if (response.status === 401) {
    result =
        "Microsoft Graph rejected the credentials (HTTP 401). Check the tenant ID, client ID and client secret, " +
        "and that the secret has not expired.";
} else if (response.status === 403) {
    // Graph often names the missing role in its message; always list the read-only ones,
    // because Graph lists read and write roles side by side.
    result =
        "Microsoft Graph refused access to this data (HTTP 403). Grant the missing application permission " +
        "in Microsoft Entra ID with admin consent." +
        (apiMessage ? " " + apiMessage : "") +
        " Read-only permissions are enough: sensitivity labels need InformationProtectionPolicy.Read.All, " +
        "alerts SecurityAlert.Read.All, and AI interactions ThreatHunting.Read.All.";
} else {
    result = apiMessage || "Microsoft Graph returned HTTP " + response.status;
}
