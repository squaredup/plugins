var matches = data.matches || [];
var teamFilter = context.objects[0] ? [].concat(context.objects[0].teamName)[0] || '' : '';

var groupMatches = matches.filter(function(m) { return m.group; });

var standings = {};

function ensureTeam(name, group) {
    if (!standings[name]) {
        standings[name] = { group: group, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    }
}

groupMatches.forEach(function(m) {
    ensureTeam(m.team1, m.group);
    ensureTeam(m.team2, m.group);

    if (!m.score || !m.score.ft) return;

    var s1 = m.score.ft[0];
    var s2 = m.score.ft[1];
    var t1 = standings[m.team1];
    var t2 = standings[m.team2];

    t1.mp++; t2.mp++;
    t1.gf += s1; t1.ga += s2;
    t2.gf += s2; t2.ga += s1;

    if (s1 > s2) {
        t1.w++; t1.pts += 3; t2.l++;
    } else if (s2 > s1) {
        t2.w++; t2.pts += 3; t1.l++;
    } else {
        t1.d++; t1.pts++; t2.d++; t2.pts++;
    }
});

var rows = Object.keys(standings).map(function(name) {
    var s = standings[name];
    return {
        sourceId: name,
        team: name,
        group: s.group,
        mp: s.mp, w: s.w, d: s.d, l: s.l,
        gf: s.gf, ga: s.ga, gd: s.gf - s.ga, pts: s.pts
    };
});

if (teamFilter && standings[teamFilter]) {
    var targetGroup = standings[teamFilter].group;
    rows = rows.filter(function(r) { return r.group === targetGroup; });
}

rows.sort(function(a, b) {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
});

result = rows;
