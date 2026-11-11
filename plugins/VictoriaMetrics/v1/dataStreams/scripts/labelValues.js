// Response body: { status, data: [value, ...] }
const values = Array.isArray(data?.data) ? data.data : [];
result = values.map((v) => ({ label: v, value: v }));
