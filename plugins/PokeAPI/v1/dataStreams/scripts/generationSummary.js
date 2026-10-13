const titleCase = (slug) =>
    String(slug || '')
        .split('-')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

const english = (data.names || []).find((n) => n.language && n.language.name === 'en');

// Match the indexed types: Stellar, Unknown and Shadow have no Pokémon or matchups
const excludedTypes = ['stellar', 'unknown', 'shadow'];
const battleTypes = (data.types || []).filter((t) => !excludedTypes.includes(t.name));

result = [
    {
        generationId: String(data.id),
        generationName: english ? english.name : titleCase(data.name),
        region: titleCase(data.main_region && data.main_region.name),
        games: (data.version_groups || []).map((g) => titleCase(g.name)).join(', '),
        newSpecies: (data.pokemon_species || []).length,
        newMoves: (data.moves || []).length,
        newAbilities: (data.abilities || []).length,
        newTypes: battleTypes.length,
        typesIntroduced: battleTypes.map((t) => titleCase(t.name)).join(', ')
    }
];
