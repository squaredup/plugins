// Wasabi reports subAccountStorage/controlAccountStorage/totalStorage in TB;
// convert to bytes to match the "bytes" shape used for these fields. Wasabi
// defines 1 TB as 1024 GB for storage billing/utilization, not decimal 10^12.
const TB_TO_BYTES = 1024 ** 4;

function toBytes(value) {
    return typeof value === "number" ? value * TB_TO_BYTES : value;
}

const account = (data && data.data) || {};

result = [
    {
        ...account,
        subAccountStorage: toBytes(account.subAccountStorage),
        controlAccountStorage: toBytes(account.controlAccountStorage),
        totalStorage: toBytes(account.totalStorage),
    },
];
