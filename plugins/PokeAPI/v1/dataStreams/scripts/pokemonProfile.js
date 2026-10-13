const title = (slug) =>
    (slug || "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

const typeNames = (data.types || [])
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((t) => title(t.type.name));
const abilities = data.abilities || [];
const visible = abilities.filter((a) => !a.is_hidden).sort((a, b) => a.slot - b.slot);
const hidden = abilities.find((a) => a.is_hidden);

result = [
    {
        pokemonId: String(data.id),
        pokemonName: title(data.species && data.species.name),
        pokedexNumber: data.id,
        primaryType: typeNames[0] || null,
        secondaryType: typeNames[1] || null,
        types: typeNames.join(" / "),
        heightM: data.height / 10,
        weightKg: data.weight / 10,
        baseExperience: data.base_experience,
        abilities: visible.map((a) => title(a.ability.name)).join(", "),
        hiddenAbility: hidden ? title(hidden.ability.name) : null,
        statTotal: (data.stats || []).reduce((s, x) => s + x.base_stat, 0),
        artworkUrl: _.get(data, ["sprites", "other", "official-artwork", "front_default"], null),
        spriteUrl: _.get(data, ["sprites", "front_default"], null),
        cryUrl: _.get(data, ["cries", "latest"], null),
    },
];
