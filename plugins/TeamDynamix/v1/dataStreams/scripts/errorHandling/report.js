// The Report stream's own error script. rateLimit.js, shared by every other stream, explains a
// 404 as a tile scoped to the wrong kind of application, which is wrong here: a report that
// can't be found is one that was deleted or that the admin service account can't see.
const status = response?.status;
const header = (name) => {
    const headers = response?.headers || {};
    return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
};

if (!status) {
    result =
        "TeamDynamix didn't respond. Check the Web API address and that the site is reachable " +
        "from SquaredUp.";
} else if (status === 404 || status === 403) {
    result =
        "TeamDynamix couldn't open this report. Check it still exists, and that it is shared " +
        "with the TeamDynamix admin service account the data source signs in as.";
} else if (status === 429) {
    const resetAt = header("X-RateLimit-Reset");
    result =
        "TeamDynamix rate limit reached" +
        (resetAt ? `. The limit resets at ${resetAt} — this tile will load again after that.` : ". Wait a minute and refresh.");
} else {
    result = data?.Message || data?.message || `TeamDynamix request failed with HTTP ${status}.`;
}
