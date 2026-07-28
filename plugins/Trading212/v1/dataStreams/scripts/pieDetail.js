// Joins the pie-level `settings` object onto every row of the `instruments`
// array so each output row carries both the instrument's own fields and the
// pie's shared context (id, name, goal, dividend action). Needs a script
// because pathToData + expandInnerObjects can only reach one of the two
// sibling structures (the array OR the object), not both on the same row.
const settings = data.settings || {};
const instruments = data.instruments || [];

result = instruments.map((instrument) => {
    const r = instrument.result || {};
    return {
        pieId: settings.id,
        pieName: settings.name,
        goal: settings.goal,
        dividendCashAction: settings.dividendCashAction,
        ticker: instrument.ticker,
        currentShare: instrument.currentShare,
        expectedShare: instrument.expectedShare,
        ownedQuantity: instrument.ownedQuantity,
        investedValue: r.priceAvgInvestedValue,
        currentValue: r.priceAvgValue,
        result: r.priceAvgResult,
        resultCoef: r.priceAvgResultCoef,
    };
});
