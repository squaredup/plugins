// Shared by every stream. Data Center Expert enforces a very low rate limit (5 requests per
// minute, per token, per service) and answers with a bare 429, so without this a throttled
// tile just says "request failed" and gives no hint that it will recover on its own.
const header = (name) => {
    const headers = response.headers || {};
    return headers[name] || headers[name.toLowerCase()];
};

if (response.status === 429) {
    const retryAfter = header("Retry-After");
    result =
        "Data Center Expert rate limit reached (5 requests per minute for each API service). " +
        (retryAfter ? `Retry after ${retryAfter} seconds.` : "Wait a minute and refresh.") +
        " If this happens often, reduce the number of tiles refreshing at the same time.";
} else if (response.status === 401) {
    result =
        "Data Center Expert rejected the request (HTTP 401). Check the username and password in the data source configuration.";
} else if (response.status === 403) {
    result =
        "The Data Center Expert user does not have permission to read this data (HTTP 403).";
} else if (response.status === 404) {
    result =
        "Not found (HTTP 404). Check the Server URL points at a Data Center Expert server with the REST API available at /isxg.";
} else {
    // Spring-style error bodies carry either `message` or OAuth `error_description`.
    result =
        (data && (data.message || data.error_description || data.error)) ||
        `Data Center Expert request failed with HTTP ${response.status}.`;
}
