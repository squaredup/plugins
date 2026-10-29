// The lineup swaps each team should have made, week by week. Matchups only
// carry player IDs, so names and positions come from Sleeper's player list
// (large, but served from Sleeper's CDN).
const api = "https://api.sleeper.app/v1";
const get = async (path) => {
    const response = await fetch(`${api}/${path}`);
    if (!response.ok) {
        throw new Error(`Sleeper API returned ${response.status} for ${path}`);
    }
    return response.json();
};

const league = data;
const { start_week: startWeek = 1, last_scored_leg: lastWeek = 0 } = league.settings || {};
const weeks = _.range(startWeek, lastWeek + 1);

const [rosters, users, players, ...weeklyMatchups] = await Promise.all([
    get(`league/${league.league_id}/rosters`),
    get(`league/${league.league_id}/users`),
    get("players/nfl"),
    ...weeks.map((week) => get(`league/${league.league_id}/matchups/${week}`)),
]);

const usersById = _.keyBy(users, "user_id");
const teamName = (rosterId) => {
    const roster = rosters.find((r) => r.roster_id === rosterId);
    const user = usersById[roster?.owner_id];
    return user?.metadata?.team_name?.trim() || user?.display_name || `Team ${rosterId}`;
};
const playerName = (id) => {
    const p = players[id];
    return p?.full_name || [p?.first_name, p?.last_name].filter(Boolean).join(" ") || id;
};
const positions = (id) => players[id]?.fantasy_positions || [players[id]?.position];

// Positions each flex slot accepts; every other slot takes only its own position.
const flexSlots = {
    FLEX: ["RB", "WR", "TE"],
    WRRB_FLEX: ["WR", "RB"],
    REC_FLEX: ["WR", "TE"],
    SUPER_FLEX: ["QB", "RB", "WR", "TE"],
};
const slotLabels = {
    FLEX: "Flex (RB/WR/TE)",
    WRRB_FLEX: "Flex (WR/RB)",
    REC_FLEX: "Flex (WR/TE)",
    SUPER_FLEX: "Superflex",
};
const fits = (slot, id) => positions(id).some((pos) => (flexSlots[slot] || [slot]).includes(pos));

// Starters line up with the league's non-bench slots, in order.
const slots = (league.roster_positions || []).filter((s) => !["BN", "IR", "TAXI"].includes(s));

const selected = (context.config.teams || []).map((t) => (Array.isArray(t.rawId) ? t.rawId[0] : t.rawId));

result = weeks.flatMap((week, i) =>
    (weeklyMatchups[i] || []).flatMap((m) => {
        const points = m.players_points || {};
        const lineup = (m.starters || []).map((id, s) => ({ slot: slots[s], id }));
        // Injured reserve and taxi players can't be started, so they're not real bench options.
        const roster = rosters.find((r) => r.roster_id === m.roster_id) || {};
        const unavailable = new Set([...(m.starters || []), ...(roster.reserve || []), ...(roster.taxi || [])]);
        const bench = (m.players || []).filter((id) => !unavailable.has(id));

        // Make the single most valuable swap, then look again: a starter moved
        // to the bench may still be the best fit for another slot.
        const swaps = [];
        for (;;) {
            let best = null;
            for (const id of bench) {
                for (const place of lineup) {
                    const gain = (points[id] || 0) - (points[place.id] || 0);
                    if (gain > 0 && fits(place.slot, id) && (!best || gain > best.gain)) {
                        best = { id, place, gain };
                    }
                }
            }
            if (!best) break;
            swaps.push({ slot: best.place.slot, benched: best.id, started: best.place.id, gain: best.gain });
            bench.splice(bench.indexOf(best.id), 1, best.place.id);
            best.place.id = best.id;
        }

        return swaps.map((swap) => ({
            sourceId: `${league.league_id}-${m.roster_id}`,
            week,
            team: teamName(m.roster_id),
            slot: slotLabels[swap.slot] || swap.slot,
            benchedPlayer: playerName(swap.benched),
            benchedPoints: points[swap.benched] || 0,
            startedPlayer: playerName(swap.started),
            startedPoints: points[swap.started] || 0,
            pointsLost: _.round(swap.gain, 2),
        }));
    }),
).filter((row) => selected.length === 0 || selected.includes(row.sourceId));
