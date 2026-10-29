// One row per team per scored week. Sleeper serves matchups one week at a
// time, so fetch every scored week alongside the rosters and users.
const api = "https://api.sleeper.app/v1";
const get = async (path) => (await fetch(`${api}/${path}`)).json();

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

result = weeks.flatMap((week, i) => {
    const matchups = weeklyMatchups[i] || [];
    const ranked = _.orderBy(matchups, ["points"], ["desc"]);
    const median = _.mean(matchups.map((m) => m.points));

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
        const rank = ranked.findIndex((o) => o.roster_id === m.roster_id) + 1;
        let outcome = null;
        if (opponent) {
            outcome = m.points > opponent.points ? "Win" : m.points < opponent.points ? "Loss" : "Tie";
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
            // Teams that would have beaten this week's score, had they all played each other.
            allPlayWins: matchups.filter((o) => o.points < m.points).length,
            allPlayLosses: matchups.filter((o) => o.points > m.points).length,
            aboveMedian: m.points > median,
            award: rank === 1 ? "Top scorer" : rank === matchups.length ? "Bottom scorer" : null,
        };
    });
}).filter((row) => selected.length === 0 || selected.includes(row.sourceId));
