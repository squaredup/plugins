result = data.tracks.items.map((item) => {
    let res = item;
    delete res['available_markets'];
    delete res['artists']['available_markets'];
    delete res['album']['available_markets'];

    return res;
});
