// dataStreams/scripts/players.js
// Calls GET /api/account purely as a cheap, already-authenticated endpoint to
// hang the request on. Lichess only offers a bulk "get users by name"
// endpoint as a raw text/plain POST body, which this plugin framework
// cannot send (a templated postBody is validated as JSON before send, and a
// preRequestScript body override isn't applied either - confirmed by testing).
// So the rows here come entirely from the plugin's configured usernames, not
// from this endpoint's response; per-player profile data is fetched by the
// dependent playerProfile step/stream instead.
const usernames = (
    (context.dataSources[0] && context.dataSources[0].usernames) || ""
)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

result = usernames.map((username) => ({
    id: username.toLowerCase(),
    username,
}));
