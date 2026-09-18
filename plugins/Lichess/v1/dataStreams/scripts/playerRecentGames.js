// dataStreams/scripts/playerRecentGames.js
// The games/user endpoint returns NDJSON, not JSON, so `data` is undefined -
// parse `response.body` ourselves, one game object per line.
const UNFINISHED_STATUSES = ["created", "started"];

result = (response.body || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .map((game) => {
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
