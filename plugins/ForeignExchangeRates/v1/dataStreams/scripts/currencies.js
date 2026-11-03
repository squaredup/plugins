result = Object.keys(data || {}).sort().map(function(code) {
    return {
        value: code,
        label: code + ' - ' + data[code]
    };
});
