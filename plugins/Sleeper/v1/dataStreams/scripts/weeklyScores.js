// One row per team per scored week. Sleeper serves matchups one week at a
// time, so fetch every scored week alongside the rosters and users.
const api = "https://api.sleeper.app/v1";
const get = async (path) => {
    const response = await fetch(`${api}/${path}`);
    if (!response.ok) {
        throw new Error(`Sleeper API returned ${response.status} for ${path}`);
    }
    return response.json();
};

const league = data;
const { start_week: startWeek = 1, last_scored_leg: lastWeek = 0, playoff_week_start: playoffStart } =
    league.settings || {};
const weeks = _.range(startWeek, lastWeek + 1);

const [rosters, users, ...weeklyMatchups] = await Promise.all([
    get(`league/${league.league_id}/rosters`),
    get(`league/${league.league_id}/users`),
    ...weeks.map((week) => get(`league/${league.league_id}/matchups/${week}`)),
]);

const usersById = _.keyBy(users, "user_id");
const teamName = (rosterId) => {
    const roster = rosters.find((r) => r.roster_id === rosterId);
    const user = usersById[roster?.owner_id];
    return user?.metadata?.team_name?.trim() || user?.display_name || `Team ${rosterId}`;
};

const selected = (context.config.teams || []).map((t) => (Array.isArray(t.rawId) ? t.rawId[0] : t.rawId));

// Weeks are processed in order, so per-team running totals can accumulate as we go.
const running = {};

result = weeks.flatMap((week, i) => {
    const matchups = weeklyMatchups[i] || [];
    const sorted = _.sortBy(matchups.map((m) => m.points));
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const lowest = sorted[0];
    const leagueAvgPoints = _.round(_.mean(sorted), 2);
    const isRegularSeason = !playoffStart || week < playoffStart;

    return matchups.map((m) => {
        const opponent = m.matchup_id
            ? matchups.find((o) => o.matchup_id === m.matchup_id && o.roster_id !== m.roster_id)
            : undefined;
        const starters = new Set(m.starters || []);
        const benchPoints = _.sum(
            Object.entries(m.players_points || {})
                .filter(([player]) => !starters.has(player))
                .map(([, points]) => points),
        );
        // Teams on the same score share a rank.
        const rank = matchups.filter((o) => o.points > m.points).length + 1;
        let outcome = null;
        if (opponent) {
            outcome = m.points > opponent.points ? "Win" : m.points < opponent.points ? "Loss" : "Tie";
        }

        const history = (running[m.roster_id] ??= { points: [], luck: 0 });
        history.points.push(m.points);
        if (isRegularSeason && opponent) {
            const actualWins = outcome === "Win" ? 1 : outcome === "Tie" ? 0.5 : 0;
            const expectedWins = matchups.length > 1 ? matchups.filter((o) => o.points < m.points).length / (matchups.length - 1) : 0;
            history.luck += actualWins - expectedWins;
        }

        return {
            sourceId: `${league.league_id}-${m.roster_id}`,
            week,
            phase: playoffStart && week >= playoffStart ? "Playoffs" : "Regular season",
            team: teamName(m.roster_id),
            points: m.points,
            opponent: opponent ? teamName(opponent.roster_id) : null,
            opponentPoints: opponent ? opponent.points : null,
            margin: opponent ? _.round(m.points - opponent.points, 2) : null,
            outcome,
            benchPoints: _.round(benchPoints, 2),
            weekRank: rank,
            leagueAvgPoints,
            rollingAvgPoints: _.round(_.mean(history.points.slice(-3)), 2),
            // Cumulative wins above what all-play results would predict; regular season only, as in Standings.
            cumulativeLuck: isRegularSeason ? _.round(history.luck, 2) : null,
            // Teams that would have beaten this week's score, had they all played each other.
            allPlayWins: matchups.filter((o) => o.points < m.points).length,
            allPlayLosses: matchups.filter((o) => o.points > m.points).length,
            aboveMedian: m.points > median,
            award: rank === 1 ? "Top scorer" : m.points === lowest ? "Bottom scorer" : null,
        };
    });
}).filter((row) => selected.length === 0 || selected.includes(row.sourceId));
