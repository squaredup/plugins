var games = data.games || [];
var teamId = context.objects[0] ? String(context.objects[0].teamId) : '';

var FLAG = {
    'Algeria': '🇩🇿', 'Argentina': '🇦🇷', 'Australia': '🇦🇺', 'Austria': '🇦🇹',
    'Belgium': '🇧🇪', 'Bosnia and Herzegovina': '🇧🇦', 'Brazil': '🇧🇷',
    'Canada': '🇨🇦', 'Cape Verde': '🇨🇻', 'Colombia': '🇨🇴', 'Croatia': '🇭🇷',
    'Curaçao': '🇨🇼', 'Czech Republic': '🇨🇿', 'Democratic Republic of the Congo': '🇨🇩',
    'Ecuador': '🇪🇨', 'Egypt': '🇪🇬', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'France': '🇫🇷',
    'Germany': '🇩🇪', 'Ghana': '🇬🇭', 'Haiti': '🇭🇹', 'Iran': '🇮🇷', 'Iraq': '🇮🇶',
    'Ivory Coast': '🇨🇮', 'Japan': '🇯🇵', 'Jordan': '🇯🇴', 'Mexico': '🇲🇽',
    'Morocco': '🇲🇦', 'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿', 'Norway': '🇳🇴',
    'Panama': '🇵🇦', 'Paraguay': '🇵🇾', 'Portugal': '🇵🇹', 'Qatar': '🇶🇦',
    'Saudi Arabia': '🇸🇦', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Senegal': '🇸🇳',
    'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Spain': '🇪🇸', 'Sweden': '🇸🇪',
    'Switzerland': '🇨🇭', 'Tunisia': '🇹🇳', 'Turkey': '🇹🇷',
    'United States': '🇺🇸', 'Uruguay': '🇺🇾', 'Uzbekistan': '🇺🇿'
};

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

function withFlag(name) {
    if (!name) return name;
    var flag = FLAG[name];
    return flag ? flag + ' ' + name : name;
}

function getTeamName(game, side) {
    var name;
    if (side === 'home') {
        name = game.home_team_id !== '0' ? game.home_team_name_en : (game.home_team_label || 'TBD');
    } else {
        name = game.away_team_id !== '0' ? game.away_team_name_en : (game.away_team_label || 'TBD');
    }
    return withFlag(name);
}

var filtered = games.filter(function(g) {
    return g.home_team_id === teamId || g.away_team_id === teamId;
});

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
