// Response body: { values: [{ value, hits }] }. A response without that list (for example
// a proxy's login page returned with HTTP 200) isn't the querying API, so return no rows
// and let setup validation fail. An empty list just means no spans in the last hour.
const values = Array.isArray(data?.values) ? data.values : null;
result = values === null ? [] : [{ connected: true, streamFields: values.length }];
