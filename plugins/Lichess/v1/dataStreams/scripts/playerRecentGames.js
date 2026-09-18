// dataStreams/scripts/playerRecentGames.js
// The games/user endpoint returns NDJSON, one game object per line. `data` is
// undefined since NDJSON isn't valid JSON, so we parse `response.body` ourselves.
// Edge case: if exactly one game matches (common with narrow timeframes), that
// single line IS valid JSON, and the platform auto-parses it into an object
// instead of leaving it as text - so response.body can be a string, an
// already-parsed single game object, or (defensively) an array of them.
const UNFINISHED_STATUSES = ["created", "started"];

const body = response.body;
const games =
    typeof body === "string"
        ? body
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => JSON.parse(line))
        : Array.isArray(body)
          ? body
          : body
            ? [body]
            : [];

result = games.map((game) => {
    const white = (game.players && game.players.white) || {};
    const black = (game.players && game.players.black) || {};

    const winner =
        game.winner ||
        (UNFINISHED_STATUSES.includes(game.status) ? null : "draw");

    return {
        id: game.id,
        rated: !!game.rated,
        variant: game.variant,
        speed: game.speed,
        createdAt: game.createdAt ? new Date(game.createdAt).toISOString() : null,
        whiteUsername: (white.user && white.user.name) || "Anonymous",
        whiteRating: typeof white.rating === "number" ? white.rating : null,
        blackUsername: (black.user && black.user.name) || "Anonymous",
        blackRating: typeof black.rating === "number" ? black.rating : null,
        winner: winner,
        openingName: (game.opening && game.opening.name) || "",
    };
});
