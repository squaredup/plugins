// account/info returns `data` as an object keyed by account_id; invalid ids come back null
const players = Object.values(data.data || {}).filter(Boolean);

result = players.map((p) => {
    const stats = p.statistics || {};
    const battles = stats.battles || 0;
    const damageDealt = (stats.damage_dealt && stats.damage_dealt.total) || 0;
    const frags = (stats.frags && stats.frags.total) || 0;

    return {
        nickname: p.nickname,
        battles: battles,
        winRate: battles ? (stats.wins / battles) * 100 : 0,
        avgDamage: battles ? damageDealt / battles : 0,
        avgXp: battles ? stats.xp / battles : 0,
        survivalRate: battles ? (stats.survived_battles / battles) * 100 : 0,
        globalRating: p.global_rating || 0,
        frags: frags,
        lastBattle: p.last_battle_time ? new Date(p.last_battle_time * 1000).toISOString() : null
    };
});
