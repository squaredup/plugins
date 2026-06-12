var games = data.games || [];

var stageMap = {
    r32: 'Round of 32',
    r16: 'Round of 16',
    qf: 'Quarter-Final',
    sf: 'Semi-Final',
    third: 'Third Place',
    final: 'Final'
};

result = games.filter(function(g) { return g.type !== 'group'; }).map(function(g) {
    var homeTeam = g.home_team_id !== '0' ? g.home_team_name_en : (g.home_team_label || 'TBD');
    var awayTeam = g.away_team_id !== '0' ? g.away_team_name_en : (g.away_team_label || 'TBD');

    var score = '-';
    if (g.finished === 'TRUE') {
        score = g.home_score + '-' + g.away_score;
    } else if (g.time_elapsed !== 'notstarted') {
        score = g.home_score + '-' + g.away_score + ' (Live)';
    }

    var status = 'Upcoming';
    if (g.finished === 'TRUE') status = 'Finished';
    else if (g.time_elapsed !== 'notstarted') status = 'Live';

    return {
        date: g.local_date,
        round: stageMap[g.type] || g.type,
        home_team: homeTeam,
        away_team: awayTeam,
        score: score,
        status: status
    };
});
