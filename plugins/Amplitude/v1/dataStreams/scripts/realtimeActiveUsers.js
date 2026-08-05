// dataStreams/scripts/realtimeActiveUsers.js
// api/2/realtime returns rolling ~2 days of data at 5-minute granularity,
// with xValues as time-of-day labels and series[0] as "today". Later buckets
// for today may be null since the day isn't over yet - find the last non-null
// value to get the current active user count.
const xValues = (data.data && data.data.xValues) || [];
const todaySeries = (data.data && data.data.series && data.data.series[0]) || [];

let idx = -1;
for (let i = todaySeries.length - 1; i >= 0; i--) {
    if (todaySeries[i] !== null && todaySeries[i] !== undefined) {
        idx = i;
        break;
    }
}

result = idx >= 0 ? [{ asOf: xValues[idx], activeUsers: todaySeries[idx] }] : [{ asOf: null, activeUsers: 0 }];
