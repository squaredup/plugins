result = data.events.map(function (event) {
    var chipMap = {};
    // Key by chip name, not array index — the API's chip_plays order/length
    // varies per gameweek, but gameweekData.json's columns (chip_plays.bboost,
    // chip_plays.freehit, etc.) need a stable path.
    (event.chip_plays || []).forEach(function (chip) {
        chipMap[chip.chip_name] = chip.num_played;
    });
    return Object.assign({}, event, { chip_plays: chipMap });
});
