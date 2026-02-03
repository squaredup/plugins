const steamGameList = data.response.games;

const myRecentGames = steamGameList.map(obj => ({
    name: obj.name,
    rtime_last_played: obj.rtime_last_played,
    playtime_forever: obj.playtime_forever,
    playtime_windows_forever: obj.playtime_windows_forever,
    playtime_linux_forever: obj.playtime_linux_forever,
    playtime_deck_forever: obj.playtime_deck_forever
}));



result = myRecentGames;