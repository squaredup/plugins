// account/info returns `data` as an object keyed by account_id; invalid ids come back null
const players = Object.values(data.data || {}).filter(Boolean);

result = players.map((p) => {
    const stats = (p.statistics && p.statistics.pvp) || {};
    const battles = stats.battles || 0;

    return {
        nickname: p.nickname,
        battles: battles,
        winRate: battles ? (stats.wins / battles) * 100 : 0,
        avgDamage: battles ? stats.damage_dealt / battles : 0,
        survivalRate: battles ? (stats.survived_battles / battles) * 100 : 0,
        frags: stats.frags || 0,
        lastBattle: p.last_battle_time ? new Date(p.last_battle_time * 1000).toISOString() : null
    };
});
