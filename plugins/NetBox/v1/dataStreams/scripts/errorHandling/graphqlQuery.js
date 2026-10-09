// GraphQL errors in a 200 response are raised by the post-request script; this covers failed HTTP requests (bad auth, malformed request)
const body = typeof response.body === "string" ? response.body.slice(0, 300) : "";
const apiMsg = (data && (data.detail || data.message)) || body;

result = apiMsg ? `HTTP ${response.status}: ${apiMsg}` : `Request failed with HTTP ${response.status}`;
