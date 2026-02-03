const steamBadges = data.response.badges;

const myBadges = steamBadges.map(obj => ({
    appid: obj.appid,
    badgeid: obj.badgeid,
    completion_time: obj.completion_time,
    xp: obj.xp,
    scarcity: obj.scarcity,
}));



result = myBadges;