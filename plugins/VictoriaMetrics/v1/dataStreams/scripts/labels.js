// Response body: { status, data: [labelName, ...] }
const names = Array.isArray(data?.data) ? data.data : [];
result = names.map((label) => ({ label, value: label }));
