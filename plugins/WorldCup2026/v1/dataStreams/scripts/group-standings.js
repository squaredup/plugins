var games = data.games || [];
var teamFilter = context.objects[0] ? context.objects[0].name_en : '';

var groupGames = games.filter(function(g) { return g.type === 'group'; });

var standings = {};

function ensureTeam(name, group) {
    if (!standings[name]) {
        standings[name] = { team: name, group: group, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
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

    home.mp++;
    away.mp++;
    home.gf += homeScore;
    home.ga += awayScore;
    away.gf += awayScore;
    away.ga += homeScore;

    if (homeScore > awayScore) {
        home.w++; home.pts += 3; away.l++;
    } else if (awayScore > homeScore) {
        away.w++; away.pts += 3; home.l++;
    } else {
        home.d++; home.pts += 1; away.d++; away.pts += 1;
    }
});

var rows = Object.keys(standings).map(function(k) {
    var s = standings[k];
    var gd = s.gf - s.ga;
    return {
        team: s.team,
        group: s.group,
        mp: s.mp,
        w: s.w,
        d: s.d,
        l: s.l,
        gf: s.gf,
        ga: s.ga,
        gd: gd,
        pts: s.pts
    };
});

if (teamFilter) {
    var matchedTeam = rows.filter(function(r) {
        return r.team === teamFilter;
    })[0];
    if (matchedTeam) {
        var targetGroup = matchedTeam.group;
        rows = rows.filter(function(r) { return r.group === targetGroup; });
    }
}

rows.sort(function(a, b) {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
});

result = rows;
