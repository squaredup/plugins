// Shared by every stream. TeamDynamix reports quota exhaustion as a bare 429 with the
// reset time in a header and nothing useful in the body, so without this a rate-limited
// tile just says "request failed" and the user has no idea it will fix itself.
//
// This also runs when TeamDynamix never answered (DNS, TLS or a timeout), and then there is no
// response to read, so every read is guarded rather than crashing and hiding the real error.
const status = response?.status;
const header = (name) => {
    const headers = response?.headers || {};
    return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
};

if (!status) {
    result =
        "TeamDynamix didn't respond. Check the Web API address and that the site is reachable " +
        "from SquaredUp.";
} else if (status === 429) {
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
} else if (status === 401 || status === 403) {
    result =
        "TeamDynamix denied this request. Either the admin service account has no access to " +
        "this application, or the BEID and Web Services Key are no longer valid.";
} else if (status === 404) {
    // Most often a tile scoped to the wrong kind of application: services and knowledge base
    // articles only exist in a client portal application, projects in a project application.
    result =
        `${data?.Message || "TeamDynamix couldn't find this."} Check the tile is scoped to the ` +
        "right kind of application: a client portal for services and knowledge base articles, " +
        "or a project application for projects.";
} else {
    // TeamDynamix error bodies are shaped { "Message": "..." }.
    result = data?.Message || data?.message || `TeamDynamix request failed with HTTP ${status}.`;
}
