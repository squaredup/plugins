// Shared by every stream. TeamDynamix reports quota exhaustion as a bare 429 with the
// reset time in a header and nothing useful in the body, so without this a rate-limited
// tile just says "request failed" and the user has no idea it will fix itself.
const header = (name) => {
    const headers = response.headers || {};
    return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
};

if (response.status === 429) {
    const resetAt = header("X-RateLimit-Reset");
    const limit = header("X-RateLimit-Limit");
    result =
        "TeamDynamix rate limit reached" +
        (limit ? ` (${limit} requests per period, per IP address)` : "") +
        ". " +
        (resetAt
            ? `The limit resets at ${resetAt} — this tile will load again after that.`
            : "Wait a minute and refresh.") +
        " If this happens often, reduce the number of TeamDynamix tiles refreshing at once.";
} else if (response.status === 401 || response.status === 403) {
    result =
        "TeamDynamix denied this request. Either the admin service account has no access to " +
        "this application, or the BEID and Web Services Key are no longer valid.";
} else {
    // TeamDynamix error bodies are shaped { "Message": "..." }.
    result =
        (data && (data.Message || data.message)) ||
        `TeamDynamix request failed with HTTP ${response.status}.`;
}
