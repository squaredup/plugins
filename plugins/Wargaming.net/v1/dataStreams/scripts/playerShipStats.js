// wows/ships/stats returns `data` keyed by account_id, value is an array of per-ship objects
const arr = Object.values(data.data || {})[0] || [];

result = arr.map((s) => {
    const p = s.pvp || {};
    const battles = p.battles || 0;
    return {
        shipId: String(s.ship_id),
        battles,
        winRate: battles ? (p.wins / battles) * 100 : 0,
        avgDamage: battles ? p.damage_dealt / battles : 0,
        frags: p.frags || 0
    };
});
