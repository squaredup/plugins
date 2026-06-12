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

var upcoming = matches.filter(function(m) {
    return !m.score && (m.team1 === teamName || m.team2 === teamName);
});

upcoming.sort(function(a, b) {
    return new Date(a.date) - new Date(b.date);
});

if (upcoming.length === 0) {
    result = [{ date: 'No upcoming matches', home_away: '', opponent: '', stage: '', group: '', sourceId: sourceId }];
} else {
    var next = upcoming[0];
    var isHome = next.team1 === teamName;
    var opponent = isHome ? next.team2 : next.team1;
    result = [{
        date: next.date,
        home_away: isHome ? 'Home' : 'Away',
        opponent: opponent,
        stage: next.group ? 'Group Stage' : (knockoutStageMap[next.round] || next.round),
        group: next.group || '',
        sourceId: sourceId
    }];
}
