// OCI errors carry { code, message } in the body. Turn the common auth and
// permission failures into actionable text.
const code = data && data.code;
const message = data && data.message;
if (response.status === 401) {
    result = "OCI rejected the request signature (401 NotAuthenticated). Check the tenancy OCID, user OCID, fingerprint and private key belong to the same API key, and that the server clock is correct.";
} else if (response.status === 404 && code === "NotAuthorizedOrNotFound") {
    result = "OCI returned NotAuthorizedOrNotFound. The resource doesn't exist, or the user's IAM policies don't allow this call. See the plugin documentation for the required policies.";
} else if (code || message) {
    // Some services return the HTTP status again as a numeric code; only show a named code.
    const named = typeof code === "string" && !/^\d+$/.test(code) ? ` ${code}` : "";
    result = `OCI error ${response.status}${named}: ${message || "no message"}`;
} else {
    result = `OCI request failed with HTTP ${response.status}`;
}
