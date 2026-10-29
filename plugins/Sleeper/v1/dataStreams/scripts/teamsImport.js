// Rosters carry only an owner_id, so fetch the league's users to name each team.
const rosters = data || [];
const leagueId = rosters[0]?.league_id;
const users = leagueId
    ? await (await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`)).json()
    : [];
const usersById = _.keyBy(users, "user_id");

result = rosters.map((roster) => {
    const user = usersById[roster.owner_id];
    const manager = user?.display_name || "Unclaimed";
    return {
        // Roster IDs restart at 1 in every league, so prefix the league.
        sourceId: `${roster.league_id}-${roster.roster_id}`,
        name: user?.metadata?.team_name?.trim() || manager,
        manager,
        rosterId: roster.roster_id,
        leagueId: roster.league_id,
    };
});
