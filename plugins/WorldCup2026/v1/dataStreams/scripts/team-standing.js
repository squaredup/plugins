var matches = data.matches || [];
var teamName = context.objects[0] ? [].concat(context.objects[0].teamName)[0] || '' : '';
var group = context.objects[0] ? [].concat(context.objects[0].group)[0] || '' : '';

var groupGames = matches.filter(function(m) {
    return m.group && (m.team1 === teamName || m.team2 === teamName);
});

var mp = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0;

groupGames.forEach(function(m) {
    if (!m.score || !m.score.ft) return;
    mp++;
    var isHome = m.team1 === teamName;
    var myScore = isHome ? m.score.ft[0] : m.score.ft[1];
    var oppScore = isHome ? m.score.ft[1] : m.score.ft[0];
    gf += myScore;
    ga += oppScore;
    if (myScore > oppScore) w++;
    else if (myScore < oppScore) l++;
    else d++;
});

var pts = (w * 3) + d;
var gd = gf - ga;

result = [{ country: teamName, group: group, mp: mp, w: w, d: d, l: l, pts: pts, gf: gf, ga: ga, gd: gd, sourceId: teamName }];
