// Wasabi reports totalStorage/activeStorage/deletedStorage in TB; convert to
// bytes to match the "bytes" shape used for these fields. Wasabi defines
// 1 TB as 1024 GB for storage billing/utilization, not the decimal 10^12.
const TB_TO_BYTES = 1024 ** 4;

function toBytes(value) {
    return typeof value === "number" ? value * TB_TO_BYTES : value;
}

const items = (data && data.data && data.data.items) || [];

result = items.map((item) => ({
    ...item,
    totalStorage: toBytes(item.totalStorage),
    activeStorage: toBytes(item.activeStorage),
    deletedStorage: toBytes(item.deletedStorage),
}));
