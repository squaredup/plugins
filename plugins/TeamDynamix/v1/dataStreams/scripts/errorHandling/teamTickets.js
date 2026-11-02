// The Team Tickets stream's own error script. Its request goes to a placeholder path that the
// data source's pre-request script swaps for the team's ticketing application, so a 404 here
// means that swap never happened: the data source is still running an older pre-request script.
const status = response?.status;
const header = (name) => {
    const headers = response?.headers || {};
    return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
};

if (!status) {
    result =
        "TeamDynamix didn't respond. Check the Web API address and that the site is reachable " +
        "from SquaredUp.";
} else if (status === 404) {
    result =
        "This data source hasn't picked up the plugin's latest sign-in script, which Team Tickets " +
        "needs to find the team's ticketing application. Open the data source and select Test and update.";
} else if (status === 401 || status === 403) {
    result =
        "TeamDynamix denied this request. Check the admin service account has access to the " +
        "team's ticketing application.";
} else if (status === 429) {
    const resetAt = header("X-RateLimit-Reset");
    result =
        "TeamDynamix rate limit reached" +
        (resetAt ? `. The limit resets at ${resetAt} — this tile will load again after that.` : ". Wait a minute and refresh.") +
        " If this happens often, reduce the number of TeamDynamix tiles refreshing at once.";
} else {
    result = data?.Message || data?.message || `TeamDynamix request failed with HTTP ${status}.`;
}
