var games = data.games || [];
var teamFilter = context.objects[0] ? [].concat(context.objects[0].teamName)[0] || '' : '';

var groupGames = games.filter(function(g) { return g.type === 'group'; });

var standings = {};

function ensureTeam(name, group) {
    if (!standings[name]) {
        standings[name] = { group: group, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
    }
}

groupGames.forEach(function(g) {
    ensureTeam(g.home_team_name_en, g.group);
    ensureTeam(g.away_team_name_en, g.group);

    if (g.finished !== 'TRUE') return;

    var homeScore = parseInt(g.home_score, 10) || 0;
    var awayScore = parseInt(g.away_score, 10) || 0;
    var home = standings[g.home_team_name_en];
    var away = standings[g.away_team_name_en];

    home.mp++; away.mp++;
    home.gf += homeScore; home.ga += awayScore;
    away.gf += awayScore; away.ga += homeScore;

    if (homeScore > awayScore) {
        home.w++; home.pts += 3; away.l++;
    } else if (awayScore > homeScore) {
        away.w++; away.pts += 3; home.l++;
    } else {
        home.d++; home.pts++; away.d++; away.pts++;
    }
});

var rows = Object.keys(standings).map(function(k) {
    var s = standings[k];
    return {
        team: k,
        group: s.group,
        mp: s.mp,
        w: s.w,
        d: s.d,
        l: s.l,
        gf: s.gf,
        ga: s.ga,
        gd: s.gf - s.ga,
        pts: s.pts
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
