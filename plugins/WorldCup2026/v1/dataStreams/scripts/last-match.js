var games = data.games || [];
var teamId = context.objects[0] ? String(context.objects[0].teamId) : '';

var stageMap = {
    group: 'Group Stage',
    r32: 'Round of 32',
    r16: 'Round of 16',
    qf: 'Quarter-Final',
    sf: 'Semi-Final',
    third: 'Third Place',
    final: 'Final'
};

function parseDate(d) {
    var parts = d.split(' ');
    var dateParts = parts[0].split('/');
    return new Date(dateParts[2] + '-' + dateParts[0] + '-' + dateParts[1] + 'T' + parts[1] + ':00');
}

var played = games.filter(function(g) {
    return g.finished === 'TRUE' &&
        (g.home_team_id === teamId || g.away_team_id === teamId);
});

played.sort(function(a, b) {
    return parseDate(b.local_date) - parseDate(a.local_date);
});

var sourceId = context.objects[0] ? context.objects[0].sourceId : '';

if (played.length === 0) {
    result = [{ date: 'No matches played yet', home_away: '', opponent: '', score: '', result: '', stage: '', sourceId: sourceId }];
} else {
    var last = played[0];
    var isHome = last.home_team_name_en === teamName;
    var opponent = isHome ? last.away_team_name_en : last.home_team_name_en;
    var myScore = parseInt(isHome ? last.home_score : last.away_score, 10);
    var oppScore = parseInt(isHome ? last.away_score : last.home_score, 10);
    var scoreStr = isHome ? last.home_score + '-' + last.away_score : last.away_score + '-' + last.home_score;
    var matchResult = myScore > oppScore ? 'Win' : myScore < oppScore ? 'Loss' : 'Draw';

    result = [{
        date: last.local_date,
        home_away: isHome ? 'Home' : 'Away',
        opponent: opponent,
        score: scoreStr,
        result: matchResult,
        stage: stageMap[last.type] || last.type,
        sourceId: sourceId
    }];
}
