// dataStreams/scripts/playerProfile.js
const perfs = data.perfs || {};
const rating = (key) => (perfs[key] ? perfs[key].rating : null);
const count = data.count || {};

result = [
    {
        id: data.id,
        username: data.username,
        title: data.title || "",
        url: `https://lichess.org/@/${data.username}`,
        createdAt: data.createdAt != null ? new Date(data.createdAt).toISOString() : null,
        seenAt: data.seenAt != null ? new Date(data.seenAt).toISOString() : null,
        gamesAll: count.all || 0,
        gamesWin: count.win || 0,
        gamesLoss: count.loss || 0,
        gamesDraw: count.draw || 0,
        bulletRating: rating("bullet"),
        blitzRating: rating("blitz"),
        rapidRating: rating("rapid"),
        classicalRating: rating("classical"),
    },
];
