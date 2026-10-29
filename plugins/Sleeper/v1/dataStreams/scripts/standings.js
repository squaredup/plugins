// Season-to-date standings. Rosters hold the record and points; luck needs
// every regular-season week's matchups to work out the all-play record.
const api = "https://api.sleeper.app/v1";
const get = async (path) => (await fetch(`${api}/${path}`)).json();

const league = data;
const { start_week: startWeek = 1, last_scored_leg: lastWeek = 0, playoff_week_start: playoffStart } =
    league.settings || {};
const regularSeasonEnd = playoffStart ? Math.min(lastWeek, playoffStart - 1) : lastWeek;
const weeks = _.range(startWeek, regularSeasonEnd + 1);

const [rosters, users, ...weeklyMatchups] = await Promise.all([
    get(`league/${league.league_id}/rosters`),
    get(`league/${league.league_id}/users`),
    ...weeks.map((week) => get(`league/${league.league_id}/matchups/${week}`)),
]);

const usersById = _.keyBy(users, "user_id");
// Sleeper splits points into an integer and a hundredths field.
const pts = (s, key) => (s[key] || 0) + (s[`${key}_decimal`] || 0) / 100;

const allPlay = {};
for (const matchups of weeklyMatchups) {
    for (const m of matchups || []) {
        const record = (allPlay[m.roster_id] ??= { wins: 0, games: 0 });
        record.wins += matchups.filter((o) => o.points < m.points).length;
        record.games += matchups.length - 1;
    }
}

const selected = (context.config.teams || []).map((t) => (Array.isArray(t.rawId) ? t.rawId[0] : t.rawId));

const rows = rosters.map((roster) => {
    const s = roster.settings || {};
    const user = usersById[roster.owner_id];
    const games = (s.wins || 0) + (s.losses || 0) + (s.ties || 0);
    const pointsFor = pts(s, "fpts");
    const maxPoints = pts(s, "ppts");
    const winPct = games ? ((s.wins || 0) + (s.ties || 0) / 2) / games : null;
    const record = allPlay[roster.roster_id];
    const allPlayPct = record?.games ? record.wins / record.games : null;

    return {
        sourceId: `${league.league_id}-${roster.roster_id}`,
        team: user?.metadata?.team_name?.trim() || user?.display_name || `Team ${roster.roster_id}`,
        manager: user?.display_name || "Unclaimed",
        wins: s.wins || 0,
        losses: s.losses || 0,
        ties: s.ties || 0,
        pointsFor: _.round(pointsFor, 2),
        pointsAgainst: _.round(pts(s, "fpts_against"), 2),
        maxPoints: _.round(maxPoints, 2),
        benchPoints: _.round(Math.max(maxPoints - pointsFor, 0), 2),
        efficiency: maxPoints ? _.round((pointsFor / maxPoints) * 100, 1) : null,
        winPct: winPct === null ? null : _.round(winPct * 100, 1),
        allPlayPct: allPlayPct === null ? null : _.round(allPlayPct * 100, 1),
        // Positive means winning more often than the points scored deserve.
        luck: winPct === null || allPlayPct === null ? null : _.round((winPct - allPlayPct) * 100, 1),
        expectedWins: allPlayPct === null ? null : _.round(allPlayPct * games, 1),
    };
});

// Sleeper seeds by wins, then points scored.
result = _.orderBy(rows, ["wins", "pointsFor"], ["desc", "desc"])
    .map((row, i) => ({ rank: i + 1, ...row }))
    .filter((row) => selected.length === 0 || selected.includes(row.sourceId));
