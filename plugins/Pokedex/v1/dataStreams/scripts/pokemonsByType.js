const titleCase = str => str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

result = (data.pokemon || []).map(entry => ({
    name: titleCase(entry.pokemon.name),
    pokemonId: entry.pokemon.url.split('/').filter(Boolean).pop(),
    slot: entry.slot
}));
