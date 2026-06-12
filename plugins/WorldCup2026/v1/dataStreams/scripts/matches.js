var games = data.games || [];
var team = context.config.team || '';

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

function getTeamName(game, side) {
    if (side === 'home') {
        return game.home_team_id !== '0' ? game.home_team_name_en : (game.home_team_label || 'TBD');
    }
    return game.away_team_id !== '0' ? game.away_team_name_en : (game.away_team_label || 'TBD');
}

var filtered = games;
if (team) {
    var teamLower = team.toLowerCase();
    filtered = games.filter(function(g) {
        var home = (g.home_team_name_en || '').toLowerCase();
        var away = (g.away_team_name_en || '').toLowerCase();
        return home.indexOf(teamLower) !== -1 || away.indexOf(teamLower) !== -1;
    });
}

filtered.sort(function(a, b) {
    return parseDate(a.local_date) - parseDate(b.local_date);
});

result = filtered.map(function(g) {
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
        home_team: getTeamName(g, 'home'),
        away_team: getTeamName(g, 'away'),
        score: score,
        group: g.group,
        stage: stageMap[g.type] || g.type,
        status: status
    };
});
