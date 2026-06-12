var games = data.games || [];
var teamId = context.objects[0] ? String(context.objects[0].teamId) : '';
var teamName = context.objects[0] ? context.objects[0].teamName : '';

var groupGames = games.filter(function(g) {
    return g.type === 'group' &&
        (g.home_team_id === teamId || g.away_team_id === teamId);
});

var mp = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0;

groupGames.forEach(function(g) {
    if (g.finished !== 'TRUE') return;
    mp++;
    var isHome = g.home_team_id === teamId;
    var myScore = parseInt(isHome ? g.home_score : g.away_score, 10) || 0;
    var oppScore = parseInt(isHome ? g.away_score : g.home_score, 10) || 0;
    gf += myScore;
    ga += oppScore;
    if (myScore > oppScore) w++;
    else if (myScore < oppScore) l++;
    else d++;
});

var pts = (w * 3) + d;

var sourceId = context.objects[0] ? context.objects[0].sourceId : '';
result = [{ country: teamName, mp: mp, w: w, d: d, l: l, pts: pts, gf: gf, ga: ga, sourceId: sourceId }];
