// Runs only when the HTTP request itself fails (wrong address, gateway error). Spacelift reports
// GraphQL errors with HTTP 200, so each stream's post-request script raises those instead.
const messages = ((data && data.errors) || []).map((e) => e && e.message).filter(Boolean);
const body = typeof response.body === "string" ? response.body.slice(0, 300) : "";
const detail = messages.join("; ") || (data && data.message) || body;

if (response.status === 404) {
    result = "No Spacelift API was found at this address (HTTP 404). Check the account URL is the address you sign in to Spacelift at.";
} else {
    result = detail ? `HTTP ${response.status}: ${detail}` : `Request failed with HTTP ${response.status}`;
}
