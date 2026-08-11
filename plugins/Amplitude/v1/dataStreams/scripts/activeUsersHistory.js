// dataStreams/scripts/activeUsersHistory.js
// Amplitude returns two parallel arrays (dates + values) rather than one row
// per date, so a post-request script is required to zip them together.
const xValues = (data.data && data.data.xValues) || [];
const series = (data.data && data.data.series && data.data.series[0]) || [];

result = xValues.map((date, i) => ({ date, users: series[i] }));
