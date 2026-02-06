result = _.flatMap(data, ({ date, stats }) => 
    _.map(stats, stat => ({ date, ...stat}))
);