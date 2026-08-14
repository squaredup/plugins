// Wasabi reports storage fields in TB and traffic fields in GB; convert both
// to bytes to match the "bytes" shape used for these fields. Wasabi defines
// 1 TB as 1024 GB for storage billing/utilization, not the decimal 10^12.
const TB_TO_BYTES = 1024 ** 4;
const GB_TO_BYTES = 1e9;

function scale(value, factor) {
    return typeof value === "number" ? value * factor : value;
}

const items = (data && data.data && data.data.items) || [];

result = items.map((item) => ({
    ...item,
    activeStorage: scale(item.activeStorage, TB_TO_BYTES),
    deletedStorage: scale(item.deletedStorage, TB_TO_BYTES),
    storageWrote: scale(item.storageWrote, TB_TO_BYTES),
    storageRead: scale(item.storageRead, TB_TO_BYTES),
    egress: scale(item.egress, GB_TO_BYTES),
    ingress: scale(item.ingress, GB_TO_BYTES),
}));
