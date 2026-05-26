const fields = data?.schema?.fields || [];
const values = data?.data?.values || [];

const idx = {};
fields.forEach((f, i) => { idx[f.name] = i; });

const times = values[idx["time"]] || [];
const lines = values[idx["line"]] || [];

const stateToInt = (state) => {
    const s = (state || "").toLowerCase();
    if (s.startsWith("normal") || s.startsWith("resolved")) return 0;
    if (s.includes("alerting") || s.includes("firing") || s.includes("error")) return 2;
    if (s.startsWith("pending") || s.startsWith("nodata")) return 1;
    return -1;
};

const numericStateShape = ["state", { map: { success: [0], warning: [1], error: [2], unknown: [-1] } }];

const metadataBase = [
    { name: "time", displayName: "Time", shape: "date", role: "timestamp" },
    { name: "current", displayName: "State String", shape: "string" },
    { name: "currentInt", displayName: "State", shape: numericStateShape, role: "value" },
    { name: "previous", displayName: "Previous State String", shape: "string" },
    { name: "previousInt", displayName: "Previous State", shape: numericStateShape, role: "value" },
    { name: "condition", displayName: "Condition", shape: "string" },
    { name: "conditionValue", displayName: "Value", shape: "number" },
    { name: "dashboardUID", displayName: "Dashboard UID", shape: "string", visible: false },
    { name: "dashboardName", displayName: "Dashboard", sourceId: "dashboardUID", sourceType: "Grafana Dashboard", objectPropertyPath: "name" }
];

const labelNames = new Set();
const metadataLabels = [];

result = times.map((t, i) => {
    const line = lines[i] || {};

    const conditionKey = line.condition;
    const rawConditionValue = conditionKey != null ? line.values?.[conditionKey] : undefined;
    const parsedConditionValue = parseFloat(rawConditionValue);

    const row = {
        time: t,
        current: line.current ?? null,
        currentInt: stateToInt(line.current),
        previous: line.previous ?? null,
        previousInt: stateToInt(line.previous),
        condition: conditionKey ?? null,
        conditionValue: rawConditionValue == null || rawConditionValue === "" || isNaN(parsedConditionValue)
            ? null
            : parsedConditionValue,
        dashboardUID: line.dashboardUID ?? null
    };

    if (typeof line.labels === "object" && line.labels !== null) {
        for (const [key, value] of Object.entries(line.labels)) {
            const name = `label_${key}`;
            if (!labelNames.has(name)) {
                labelNames.add(name);
                metadataLabels.push({ name, displayName: `${key} (label)`, shape: "string" });
            }
            row[name] = value;
        }
    }

    return row;
});

metadata = [...metadataBase, ...metadataLabels];