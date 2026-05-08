const titleCase = str => str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

const types = (data.types || [])
    .sort((a, b) => a.slot - b.slot)
    .map(t => titleCase(t.type.name))
    .join(', ');

const abilities = (data.abilities || [])
    .filter(a => !a.is_hidden)
    .sort((a, b) => a.slot - b.slot)
    .map(a => titleCase(a.ability.name))
    .join(', ');

const hiddenAbility = (data.abilities || [])
    .filter(a => a.is_hidden)
    .map(a => titleCase(a.ability.name))
    .join(', ') || 'None';

result = [{
    height: data.height,
    weight: data.weight,
    baseExperience: data.base_experience,
    types,
    abilities,
    hiddenAbility
}];
