const responseTimes = (data?.monitors || [])
    .map((result) => {
        return result.response_times.map((row) => ({
            ...row,
            friendly_name: result.friendly_name
        }));
    })
    .flat();

result = responseTimes;
