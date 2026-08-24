// wows/ships/stats returns `data` keyed by account_id, value is an array of per-ship objects
const arr = Object.values(data.data || {})[0] || [];

result = arr.map((s) => {
    const p = s.pvp || {};
    const battles = p.battles || 0;
    const wins = p.wins || 0;
    const damageDealt = p.damage_dealt || 0;
    return {
        shipId: String(s.ship_id),
        battles,
        winRate: battles ? (wins / battles) * 100 : 0,
        avgDamage: battles ? damageDealt / battles : 0,
        frags: p.frags || 0,
        lastBattle: s.last_battle_time ? new Date(s.last_battle_time * 1000).toISOString() : null
    };
});
