const startTime = parseInt('{{timeframe.unixStart}}');
const endTime = parseInt('{{timeframe.unixEnd}}');

const eventLogs = data.monitors
    .map((result) => {
        return result.logs.map((row) => ({
            ...row,
            friendly_name: result.friendly_name
        }));
    })
    .flat()
    .filter((row) => row.datetime >= startTime && row.datetime <= endTime);

result = eventLogs;
