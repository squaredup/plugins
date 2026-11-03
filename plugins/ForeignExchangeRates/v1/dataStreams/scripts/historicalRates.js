var byDate = data.rates || {};
var rows = [];

// Rates are published on working days only, so weekends and holidays have no row.
Object.keys(byDate).sort().forEach(function(date) {
    Object.keys(byDate[date]).forEach(function(currency) {
        rows.push({
            date: date,
            pair: data.base + '/' + currency,
            base: data.base,
            currency: currency,
            rate: byDate[date][currency]
        });
    });
});

result = rows;
