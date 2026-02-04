const steamGameNews = data.appnews.newsitems;

const myGameNews = steamGameNews.map(obj => ({
    title: obj.title,
    url: obj.url,
    feedlabel: obj.feedlabel,
    date: obj.date,
    playtime_linux_forever: obj.playtime_linux_forever,
    playtime_deck_forever: obj.playtime_deck_forever
}));



result = myGameNews;