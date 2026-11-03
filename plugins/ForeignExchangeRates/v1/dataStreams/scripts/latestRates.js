// The request covers the last ten days so the two most recent working days are
// always present, even across weekends and bank holidays.
var dates = Object.keys(data.rates || {}).sort();
var latestDate = dates[dates.length - 1];
var previousDate = dates[dates.length - 2];
var latest = latestDate ? data.rates[latestDate] : {};
var previous = previousDate ? data.rates[previousDate] : {};

result = Object.keys(latest).map(function(currency) {
    var rate = latest[currency];
    var previousRate = previous[currency] !== undefined ? previous[currency] : null;

    return {
        pair: data.base + '/' + currency,
        base: data.base,
        currency: currency,
        rate: rate,
        // Percentage change since the previous working day, on a 0-100 scale for the percent shape.
        change: previousRate ? (100 * (rate - previousRate)) / previousRate : null,
        previousRate: previousRate,
        date: latestDate
    };
});
