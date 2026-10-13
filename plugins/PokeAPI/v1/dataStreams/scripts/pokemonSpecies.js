// One row per species. A script is needed because names, genera and flavour text are
// arrays of per-language entries that must be filtered to English and reduced to one value.
const title = (slug) =>
    slug
        ? slug
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")
        : null;

const english = (entries) => (entries || []).filter((e) => e.language && e.language.name === "en");

const englishName = english(data.names)[0];
const englishGenus = english(data.genera)[0];

// Flavour text is ordered oldest to newest, so the last English entry is the most recent game
const entries = english(data.flavor_text_entries);
const latest = entries[entries.length - 1];

// gender_rate is the chance of being female in eighths; -1 means genderless
const genderless = data.gender_rate === -1;

result = [
    {
        pokemonId: String(data.id),
        pokemonName: englishName ? englishName.name : title(data.name),
        genus: englishGenus ? englishGenus.genus : null,
        generation: data.generation ? "Generation " + data.generation.name.split("-").pop().toUpperCase() : null,
        isLegendary: !!data.is_legendary,
        isMythical: !!data.is_mythical,
        isBaby: !!data.is_baby,
        rarity: data.is_legendary ? "Legendary" : data.is_mythical ? "Mythical" : data.is_baby ? "Baby" : "Standard",
        captureRate: data.capture_rate,
        baseHappiness: data.base_happiness,
        femalePercent: genderless ? null : (data.gender_rate / 8) * 100,
        genderless,
        eggCycles: data.hatch_counter,
        growthRate: title(data.growth_rate && data.growth_rate.name),
        habitat: title(data.habitat && data.habitat.name),
        colour: title(data.color && data.color.name),
        bodyShape: title(data.shape && data.shape.name),
        eggGroups: (data.egg_groups || []).map((g) => title(g.name)).join(", "),
        evolvesFrom: title(data.evolves_from_species && data.evolves_from_species.name),
        pokedexEntry: latest ? latest.flavor_text.replace(/\s+/g, " ").trim() : null,
        pokedexEntryGame: latest ? title(latest.version.name) : null,
        formCount: (data.varieties || []).length,
    },
];
