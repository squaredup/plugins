var matches = data.matches || [];
var seen = {};
var teams = [];

matches.filter(function(m) { return m.group; }).forEach(function(m) {
    [{ name: m.team1, group: m.group }, { name: m.team2, group: m.group }].forEach(function(t) {
        if (!seen[t.name]) {
            seen[t.name] = true;
            teams.push({ sourceId: t.name, name_en: t.name, group: t.group });
        }
    });
});

result = teams;
