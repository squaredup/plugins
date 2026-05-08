const titleCase = str => str.charAt(0).toUpperCase() + str.slice(1);
const relations = data.damage_relations || {};
const rows = [];

const addRelations = (list, relation, multiplier) => {
    (list || []).forEach(t => {
        rows.push({ type: titleCase(t.name), relation, multiplier });
    });
};

addRelations(relations.double_damage_to, 'Double damage to', '2×');
addRelations(relations.half_damage_to, 'Half damage to', '0.5×');
addRelations(relations.no_damage_to, 'No damage to', '0×');
addRelations(relations.double_damage_from, 'Double damage from', '2×');
addRelations(relations.half_damage_from, 'Half damage from', '0.5×');
addRelations(relations.no_damage_from, 'No damage from', '0×');

result = rows;
