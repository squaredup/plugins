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
    if (m.score && (m.score.et || m.score.ft)) {
        // Prefer the score after extra time; fall back to the 90-minute (ft) score.
        var base = m.score.et || m.score.ft;
        score = base[0] + '-' + base[1];
        if (m.score.p) {
            score += ' (' + m.score.p[0] + '-' + m.score.p[1] + ' pens)';
        }
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
