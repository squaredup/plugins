const { queryResult: [queryResultBody] = [], errors } = data;

if (errors?.errors?.length && !queryResultBody?.timeSeriesList?.timeSeries?.length) {
    throw new Error(errors.errors.map(({ message }) => message).join(', '));
}

if (queryResultBody) {
    const timeseriesResults = queryResultBody.timeSeriesList.timeSeries;

    result = timeseriesResults.flatMap(({ metricDefinition, points }) => 
        points.timestamps.map((timestamp, index) => ({
            value: points.values[index],
            timestamp,
            unit: queryResultBody.timeSeriesList.unit,
            ...metricDefinition
        }))
    )
}
