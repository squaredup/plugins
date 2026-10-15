// dataStreams/scripts/playerActivity.js
//
// `games` is keyed by perf/variant (blitz, bullet, rapid, ...) with win/loss/draw
// directly on each entry. Correspondence games that finished that day are NOT
// reported under `games` - they appear under a separate `correspondenceEnds` key,
// keyed by variant, with the win/loss/draw nested one level deeper under `.score`
// (`correspondenceEnds.correspondence.score.win`). `correspondenceMoves` is moves
// made in ongoing correspondence games (no result yet) and is intentionally excluded.
const scoreOf = (perfEntry) => (perfEntry && perfEntry.score) || perfEntry || {};
const sumField = (map, field) =>
    Object.values(map || {}).reduce((sum, perfEntry) => sum + (scoreOf(perfEntry)[field] || 0), 0);

result = (data || []).map((entry) => {
    const puzzles = (entry.puzzles && entry.puzzles.score) || {};

    return {
        date: entry.interval && entry.interval.start ? new Date(entry.interval.start).toISOString() : null,
        gamesWin: sumField(entry.games, "win") + sumField(entry.correspondenceEnds, "win"),
        gamesLoss: sumField(entry.games, "loss") + sumField(entry.correspondenceEnds, "loss"),
        gamesDraw: sumField(entry.games, "draw") + sumField(entry.correspondenceEnds, "draw"),
        puzzlesWin: puzzles.win || 0,
        puzzlesLoss: puzzles.loss || 0,
        puzzlesDraw: puzzles.draw || 0
    };
});
