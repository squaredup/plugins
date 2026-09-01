// Shared by every stream. Automox returns a bare 429 with the retry window in
// response headers and nothing actionable in the body, so without this a
// rate-limited tile just says "request failed" with no indication it will
// recover on its own. This plugin framework has no request-level retry/backoff
// hook - this only shapes the error message shown to the user.
const header = (name) => {
    const headers = response.headers || {};
    return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
};

if (response.status === 429) {
    const limit = header("x-ratelimit-limit");
    const remaining = header("x-ratelimit-remaining");
    const resetAt = header("x-ratelimit-reset");
    result =
        "Automox API rate limit reached" +
        (limit ? ` (${limit} requests/minute)` : "") +
        ". " +
        (resetAt
            ? `Resets at ${resetAt} (remaining this window: ${remaining ?? "0"}) - this tile will load again after that.`
            : "Wait a minute and refresh.") +
        " If this happens often on Device Inventory, avoid scoping it to the full device estate.";
} else {
    const apiMsg = data && (data.message || data.error || data.Message);
    result = apiMsg || `Automox request failed with HTTP ${response.status}.`;
}
