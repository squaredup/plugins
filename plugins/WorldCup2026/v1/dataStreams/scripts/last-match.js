var matches = data.matches || [];
var teamName = context.objects[0] ? [].concat(context.objects[0].teamName)[0] || '' : '';
var sourceId = context.objects[0] ? context.objects[0].sourceId : '';

var knockoutStageMap = {
    'Round of 32': 'Round of 32',
    'Round of 16': 'Round of 16',
    'Quarter-final': 'Quarter-Final',
    'Semi-final': 'Semi-Final',
    'Third-place play-off': 'Third Place',
    'Final': 'Final'
};

var played = matches.filter(function(m) {
    return m.score && (m.team1 === teamName || m.team2 === teamName);
});

played.sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
});

if (played.length === 0) {
    result = [{ date: 'No matches played yet', home_away: '', opponent: '', score: '', result: '', stage: '', sourceId: sourceId }];
} else {
    var last = played[0];
    var isHome = last.team1 === teamName;
    var opponent = isHome ? last.team2 : last.team1;
    var myScore = isHome ? last.score.ft[0] : last.score.ft[1];
    var oppScore = isHome ? last.score.ft[1] : last.score.ft[0];
    var matchResult = myScore > oppScore ? 'Win' : myScore < oppScore ? 'Loss' : 'Draw';

    result = [{
        date: last.date,
        home_away: isHome ? 'Home' : 'Away',
        opponent: opponent,
        score: myScore + '-' + oppScore,
        result: matchResult,
        stage: last.group ? 'Group Stage' : (knockoutStageMap[last.round] || last.round),
        sourceId: sourceId
    }];
}
