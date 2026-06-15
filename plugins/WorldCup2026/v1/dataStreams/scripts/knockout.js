var matches = data.matches || [];

var stageMap = {
    'Round of 32': 'Round of 32',
    'Round of 16': 'Round of 16',
    'Quarter-final': 'Quarter-Final',
    'Semi-final': 'Semi-Final',
    'Third-place play-off': 'Third Place',
    'Final': 'Final'
};

result = matches.filter(function(m) { return !m.group; }).map(function(m) {
    var score = '-';
    var status = 'Upcoming';
    if (m.score && m.score.ft) {
        score = m.score.ft[0] + '-' + m.score.ft[1];
        status = 'Finished';
    }

    return {
        date: m.date,
        round: stageMap[m.round] || m.round,
        home_team: m.team1,
        away_team: m.team2,
        score: score,
        status: status
    };
});
