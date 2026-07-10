// tanks/stats returns `data` keyed by account_id, value is an array of per-tank objects
const arr = Object.values(data.data || {})[0] || [];

result = arr.map((t) => {
    const s = t.all || {};
    const battles = s.battles || 0;
    const wins = s.wins || 0;
    const damageDealt = s.damage_dealt || 0;
    return {
        tankId: String(t.tank_id),
        battles,
        winRate: battles ? (wins / battles) * 100 : 0,
        avgDamage: battles ? damageDealt / battles : 0,
        frags: s.frags || 0,
        spotted: s.spotted || 0,
        markOfMastery: t.mark_of_mastery || 0
    };
});
