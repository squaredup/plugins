result = data.events.map(function (event) {
    var chipMap = {};
    (event.chip_plays || []).forEach(function (chip) {
        chipMap[chip.chip_name] = chip.num_played;
    });
    return Object.assign({}, event, { chip_plays: chipMap });
});
