// pathToData cannot reach the parent generation fields, so carry them onto each species row
const english = (data.names || []).find((n) => n.language && n.language.name === "en");
const generationName = english ? english.name : data.name;
const titleCase = (slug) => slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

result = (data.pokemon_species || []).map((s) => {
    const pokemonId = s.url.split("/").filter(Boolean).pop();
    return {
        generationId: String(data.id),
        generationName,
        pokemonId,
        pokemonName: titleCase(s.name),
        pokedexNumber: Number(pokemonId)
    };
});
