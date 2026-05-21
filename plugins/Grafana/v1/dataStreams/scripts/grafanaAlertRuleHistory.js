const fields = data?.schema?.fields || [];
const values = data?.data?.values || [];

const idx = {};
fields.forEach((f, i) => { idx[f.name] = i; });

const times = values[idx["time"]] || [];
const lines = values[idx["line"]] || [];

const stateToInt = (state) => {
    const s = (state || "").toLowerCase();
    if (["alerting", "firing", "error"].includes(s)) return 2;
    if (["pending", "nodata"].includes(s)) return 1;
    if (["inactive", "normal", "normal (updated)", "resolved"].includes(s)) return 0;
    return -1;
};

const stateShape = ["state", {
    map: {
        error: ["alerting", "Alerting", "firing", "Firing", "error", "Error"],
        warning: ["pending", "Pending", "nodata", "NoData"],
        success: ["inactive", "Inactive", "normal", "Normal", "normal (updated)", "Normal (Updated)", "resolved", "Resolved"]
    }
}];

const metadataBase = [
    { name: "time", displayName: "Time", shape: "date", role: "timestamp" },
    { name: "current", displayName: "State", shape: stateShape },
    { name: "previous", displayName: "Previous State", shape: stateShape },
    { name: "condition", displayName: "Condition", shape: "string" },
    { name: "conditionValue", displayName: "Value", shape: "number" },
    { name: "currentInt", displayName: "State (int)", shape: "number" },
    { name: "previousInt", displayName: "Previous State (int)", shape: "number" },
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