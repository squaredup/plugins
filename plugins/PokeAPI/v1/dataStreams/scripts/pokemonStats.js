const titleCase = (slug) =>
    slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const labels = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
};

result = (data.stats || []).map((s, i) => ({
    pokemonId: String(data.id),
    pokemonName: titleCase(data.species.name),
    stat: labels[s.stat.name] || titleCase(s.stat.name),
    statOrder: i + 1,
    baseStat: s.base_stat,
    effortYield: s.effort,
}));
