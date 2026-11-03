// The request covers the last ten days so the two most recent working days are
// always present, even across weekends and bank holidays.
var rows = Array.isArray(data) ? data : [];
var dates = _.uniq(rows.map(function(r) { return r.date; })).sort();
var latestDate = dates[dates.length - 1];
var previousDate = dates[dates.length - 2];

var previousByQuote = {};
rows.forEach(function(r) {
    if (r.date === previousDate) previousByQuote[r.quote] = r.rate;
});

result = rows
    .filter(function(r) { return r.date === latestDate && r.quote !== r.base; })
    .map(function(r) {
        var previousRate = previousByQuote[r.quote] !== undefined ? previousByQuote[r.quote] : null;

        return {
            pair: r.base + '/' + r.quote,
            base: r.base,
            currency: r.quote,
            rate: r.rate,
            // Percentage change since the previous working day, on a 0-100 scale for the percent shape.
            change: previousRate ? (100 * (r.rate - previousRate)) / previousRate : null,
            previousRate: previousRate,
            date: latestDate
        };
    });
