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

var teamGames = games.filter(function(g) {
    return g.home_team_id === teamId || g.away_team_id === teamId;
});

var upcoming = teamGames.filter(function(g) {
    return g.finished !== 'TRUE' && g.time_elapsed === 'notstarted';
});

upcoming.sort(function(a, b) {
    return parseDate(a.local_date) - parseDate(b.local_date);
});

var sourceId = context.objects[0] ? context.objects[0].sourceId : '';

if (upcoming.length === 0) {
    result = [{ date: 'No upcoming matches', home_away: '', opponent: '', stage: '', group: '', sourceId: sourceId }];
} else {
    var next = upcoming[0];
    var isHome = next.home_team_id === teamId;
    var opponent = isHome ? next.away_team_name_en : next.home_team_name_en;
    if (!opponent || opponent === 'undefined') {
        opponent = isHome ? (next.away_team_label || 'TBD') : (next.home_team_label || 'TBD');
    }
    result = [{
        date: next.local_date,
        home_away: isHome ? 'Home' : 'Away',
        opponent: opponent,
        stage: stageMap[next.type] || next.type,
        group: next.type === 'group' ? 'Group ' + next.group : '',
        sourceId: sourceId
    }];
}
