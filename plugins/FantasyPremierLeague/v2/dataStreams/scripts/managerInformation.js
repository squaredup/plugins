result = [Object.assign({}, data, {
    bank: typeof data.bank === 'number' ? '£' + (data.bank / 10).toFixed(1) + 'M' : data.bank,
    value: typeof data.value === 'number' ? '£' + (data.value / 10).toFixed(1) + 'M' : data.value
})];
