// Wasabi reports storage fields in TB and traffic fields in GB; convert both
// to bytes to match the "bytes" shape used for these fields.
const TB_TO_BYTES = 1e12;
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
