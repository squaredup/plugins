// Rates are published on working days only, so weekends and holidays have no row.
result = (Array.isArray(data) ? data : [])
    .filter(function(r) { return r.quote !== r.base; })
    .sort(function(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; })
    .map(function(r) {
        return {
            date: r.date,
            pair: r.base + '/' + r.quote,
            base: r.base,
            currency: r.quote,
            rate: r.rate
        };
    });
