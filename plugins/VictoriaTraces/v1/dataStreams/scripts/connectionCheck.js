// Response body: { values: [{ value, hits }] }. Any successful response means the
// querying API is reachable; an empty list just means no spans in the last hour.
const values = Array.isArray(data?.values) ? data.values : [];
result = [{ connected: true, streamFields: values.length }];
