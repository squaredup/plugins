// Wasabi reports totalStorage/activeStorage/deletedStorage in TB; convert to
// bytes to match the "bytes" shape used for these fields.
const TB_TO_BYTES = 1e12;

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
