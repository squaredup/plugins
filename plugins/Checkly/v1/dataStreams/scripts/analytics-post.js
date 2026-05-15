result = _.flatMap(data.series, s => {
    return s.data.map(d => {
        return {
            name: data.name,
            checkId: data.checkId,
            ...d
        }
    });
});