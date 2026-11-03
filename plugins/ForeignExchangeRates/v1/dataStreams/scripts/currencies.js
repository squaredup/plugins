// The ECB provider also lists currencies it no longer publishes, so keep only those with a recent rate.
var cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

result = (Array.isArray(data) ? data : [])
    .filter(function(c) { return c.end_date && c.end_date >= cutoff; })
    .sort(function(a, b) { return a.iso_code < b.iso_code ? -1 : 1; })
    .map(function(c) {
        return {
            value: c.iso_code,
            label: c.iso_code + ' - ' + c.name
        };
    });
