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
    var isHome = last.home_team_id === teamId;
    var opponent = isHome ? last.away_team_name_en : last.home_team_name_en;
    var myScore = parseInt(isHome ? last.home_score : last.away_score, 10);
    var oppScore = parseInt(isHome ? last.away_score : last.home_score, 10);
    var scoreStr = isHome ? last.home_score + '-' + last.away_score : last.away_score + '-' + last.home_score;
    var matchResult = myScore > oppScore ? 'Win' : myScore < oppScore ? 'Loss' : 'Draw';
    var opFlag = FLAG[opponent] || '';

    result = [{
        date: last.local_date,
        home_away: isHome ? 'Home' : 'Away',
        opponent: opFlag ? opFlag + ' ' + opponent : opponent,
        score: scoreStr,
        result: matchResult,
        stage: stageMap[last.type] || last.type,
        sourceId: sourceId
    }];
}
