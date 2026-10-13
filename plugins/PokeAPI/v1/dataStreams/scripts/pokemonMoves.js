// Version-group ids are chronological except these two retro Japanese releases,
// which were added to the API out of sequence and would otherwise look "newest"
const excluded = ["red-green-japan", "blue-japan"];

const titleCase = (slug) =>
    String(slug || "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
const groupId = (vg) => Number(String(vg.url).split("/").filter(Boolean).pop());

// Flatten to one entry per (move, version group, method)
const entries = (data.moves || []).flatMap((m) =>
    (m.version_group_details || [])
        .filter((d) => !excluded.includes(d.version_group.name))
        .map((d) => ({ move: m.move.name, detail: d, id: groupId(d.version_group) })),
);

// Prefer the newest game with a real learnset: some recent groups (e.g. champions)
// only carry the "train" method, so require at least one level-up entry. Fall back
// to the newest group of any kind if none has level-up data.
const pickNewest = (list) =>
    list.reduce((best, e) => (best === null || e.id > best ? e.id : best), null);
const levelUpGroup = pickNewest(entries.filter((e) => e.detail.move_learn_method.name === "level-up"));
const chosen = levelUpGroup !== null ? levelUpGroup : pickNewest(entries);

if (chosen === null) {
    result = [];
} else {
    const pokemonName = titleCase(data.species && data.species.name);
    result = entries
        .filter((e) => e.id === chosen)
        .map((e) => {
            const isLevelUp = e.detail.move_learn_method.name === "level-up";
            // Since Generation VII a level-up move at level 0 is learned on evolving
            const onEvolution = isLevelUp && e.detail.level_learned_at === 0;
            return {
                pokemonId: String(data.id),
                pokemonName,
                move: titleCase(e.move),
                learnMethod: onEvolution ? "Evolution" : titleCase(e.detail.move_learn_method.name),
                // The API reports 0 for non-level-up methods, which is not a real level
                level: isLevelUp && !onEvolution ? e.detail.level_learned_at : null,
                game: titleCase(e.detail.version_group.name),
            };
        });
}
