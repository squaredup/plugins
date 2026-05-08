const titleCase = str => str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

const moves = (data.moves || []).map(m => {
    const details = m.version_group_details[m.version_group_details.length - 1] || {};
    const method = titleCase(details.move_learn_method?.name || '');
    const level = details.level_learned_at || 0;
    return {
        move: titleCase(m.move.name),
        method,
        level
    };
});

result = _.orderBy(moves, ['method', 'level', 'move'], ['asc', 'asc', 'asc']);
