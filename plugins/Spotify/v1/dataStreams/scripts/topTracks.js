result = data.items.map((item) => {
    let res = item;
    delete res['album']['available_markets'];
    delete res['available_markets'];
    return res;
});
