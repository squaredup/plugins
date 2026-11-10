// Errors from streams that call Microsoft Graph. The common failures are licence and permission
// gaps rather than faults, so name what is missing instead of passing on the raw Graph error.
const error = (data && data.error) || {};
const apiMessage = typeof error.message === "string" ? error.message : "";

// Advanced hunting runs, but the tenant's licences don't include the table the query reads.
// Device tables (DeviceInfo, DeviceTvm...) need Defender for Endpoint Plan 2 or equivalent.
const missingTable = apiMessage.match(/Failed to resolve table or column expression named '([^']+)'/);

if (missingTable && missingTable[1].startsWith("Device")) {
    // Name the table: a typo in a custom query fails the same way as a missing licence.
    result =
        "The advanced hunting table '" +
        missingTable[1] +
        "' isn't available. If the name is right, your Microsoft Defender licence doesn't include " +
        "advanced hunting on device data, such as Microsoft Defender for Endpoint Plan 2. " +
        "The Overview and Incidents dashboards work without it.";
} else if (missingTable) {
    result =
        "The advanced hunting table '" +
        missingTable[1] +
        "' isn't available in this tenant. The tables you can query depend on your Microsoft Defender licences.";
} else if (response.status === 401) {
    result =
        "Microsoft Graph rejected the credentials (HTTP 401). Check the tenant ID, client ID and client secret, " +
        "and that the secret has not expired.";
} else if (response.status === 403) {
    // Graph names the missing role in its message, for example "API required roles: ThreatHunting.Read.All".
    result =
        "Microsoft Graph refused access to this data (HTTP 403). Grant the missing application permission " +
        "in Microsoft Entra ID with admin consent, and check the tenant has a licence that includes this data." +
        (apiMessage ? " " + apiMessage : "") +
        // Always list the read-only roles: Secure Score's 403 names none, and Graph lists read and
        // write roles side by side for alerts and incidents, where read-only is enough.
        " Read-only permissions are enough: alerts need SecurityAlert.Read.All, incidents " +
        "SecurityIncident.Read.All, Secure Score SecurityEvents.Read.All, and advanced hunting ThreatHunting.Read.All.";
} else {
    result = apiMessage || "Microsoft Graph returned HTTP " + response.status;
}
