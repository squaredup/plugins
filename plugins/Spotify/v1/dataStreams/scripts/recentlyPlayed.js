result = data.items.map((item) => {
    let res = item;
    delete res['track']['album']['available_markets'];
    delete res['track']['available_markets'];
    return res;
});
