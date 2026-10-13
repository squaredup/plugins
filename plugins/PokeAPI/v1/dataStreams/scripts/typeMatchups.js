// damage_relations is an object of six arrays, not a list of rows, so each (relation, other type)
// pair has to be unrolled into its own row. Multiplier and wording are fixed per relation key.
const relations = {
    double_damage_to: { direction: "Attacking", multiplier: 2, effectiveness: "Super effective", relation: "Double damage to" },
    half_damage_to: { direction: "Attacking", multiplier: 0.5, effectiveness: "Not very effective", relation: "Half damage to" },
    no_damage_to: { direction: "Attacking", multiplier: 0, effectiveness: "No effect", relation: "No damage to" },
    double_damage_from: { direction: "Defending", multiplier: 2, effectiveness: "Super effective", relation: "Double damage from" },
    half_damage_from: { direction: "Defending", multiplier: 0.5, effectiveness: "Not very effective", relation: "Half damage from" },
    no_damage_from: { direction: "Defending", multiplier: 0, effectiveness: "No effect", relation: "No damage from" },
};

// The slug ("fire") is title-cased; the localised name is only used for the scoped type itself
const titleCase = (slug) => slug.charAt(0).toUpperCase() + slug.slice(1);
const idFromUrl = (url) => url.split("/").filter(Boolean).pop();

// Identity comes from the response body, so it stays correct when a tile is scoped to several types
const english = (data.names || []).find((n) => n.language && n.language.name === "en");
const typeName = english ? english.name : titleCase(data.name);
const typeId = String(data.id);

result = Object.entries(relations).flatMap(([key, rel]) =>
    ((data.damage_relations || {})[key] || []).map((other) => ({
        typeId,
        typeName,
        direction: rel.direction,
        multiplier: rel.multiplier,
        effectiveness: rel.effectiveness,
        relation: rel.relation,
        otherTypeId: idFromUrl(other.url),
        otherTypeName: titleCase(other.name),
    })),
);
