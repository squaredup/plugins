const statNames = {
    'hp': 'HP',
    'attack': 'Attack',
    'defense': 'Defense',
    'special-attack': 'Special Attack',
    'special-defense': 'Special Defense',
    'speed': 'Speed'
};

result = (data.stats || []).map(s => ({
    stat: statNames[s.stat.name] || s.stat.name,
    value: s.base_stat
}));
