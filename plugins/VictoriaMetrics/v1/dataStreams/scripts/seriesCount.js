// Response body: { status, data: [count] }
const count = Array.isArray(data?.data) ? Number(data.data[0]) : null;
result = count === null ? [] : [{ count }];
