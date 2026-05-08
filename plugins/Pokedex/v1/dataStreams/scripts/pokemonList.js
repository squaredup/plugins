const results = data?.results || [];

result = results.map(entry => {
    const id = entry.url.split('/').filter(Boolean).pop();
    const name = entry.name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    return {
        sourceId: id,
        name,
        pokemonId: id
    };
});
