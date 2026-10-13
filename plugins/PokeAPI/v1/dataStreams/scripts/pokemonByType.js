// The type endpoint returns one body per type; rows are derived from the body, not context.objects
const english = (data.names || []).find((n) => n.language && n.language.name === "en");
const typeName = english ? english.name : data.name;

// Alternate forms (Mega, Gigantamax, regional) have ids >= 10000 and are not indexed as Pokemon,
// so keeping them would inflate per-type counts. Ids below 10000 equal the Pokemon object's rawId.
result = (data.pokemon || [])
    .map((entry) => ({
        typeId: String(data.id),
        typeName,
        pokemonId: entry.pokemon.url.split("/").filter(Boolean).pop(),
        slot: entry.slot === 1 ? "Primary" : "Secondary"
    }))
    .filter((row) => Number(row.pokemonId) < 10000)
    .map((row) => ({ ...row, pokedexNumber: Number(row.pokemonId) }));
