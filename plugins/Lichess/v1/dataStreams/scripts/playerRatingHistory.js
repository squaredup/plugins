// dataStreams/scripts/playerRatingHistory.js
// The rating-history endpoint takes no query params and always returns the
// player's full history, so the timeframe filter is applied client-side here.
const rows = (data || []).flatMap((v) =>
    (v.points || []).map((p) => ({
        variant: v.name,
        date: new Date(Date.UTC(p[0], p[1], p[2])).toISOString(),
        rating: p[3],
    })),
);

const timeframe = context && context.timeframe;

result =
    timeframe && timeframe.start && timeframe.end
        ? rows.filter((r) => r.date >= timeframe.start && r.date <= timeframe.end)
        : rows;
