const metadataBase = [
    { name: "ruleName", displayName: "Rule", shape: "string", role: "label" },
    { name: "groupName", displayName: "Group", shape: "string" },
    { name: "namespace", displayName: "Folder", shape: "string" },
    {
        name: "state",
        displayName: "State",
        shape: [
            "state",
            {
                map: {
                    error: [
                        "alerting", "Alerting",
                        "firing", "Firing"],
                    warning: [
                        "pending", "Pending"
                    ],
                    success: [
                        "inactive", "Inactive",
                        "normal", "Normal",
                        "resolved", "Resolved",
                    ],
                },
            },
        ],
    },
    { name: "activeAt", displayName: "Active Since", shape: "date" },
    { name: "value", displayName: "Value", shape: "number" },
];
const labelNames = new Set();
const metadataLabels = [];
const annotationNames = new Set();
const metadataAnnotations = [];

const shapeForValue = (value) => {
    if (typeof value === "number") return "number";
    if (typeof value === "string" && (value === "true" || value === "false"))
        return "boolean";
    return "string";
};

result = [];
const groups = data?.data?.groups || [];
for (const group of groups) {
    for (const rule of group.rules) {
        if (rule.type !== "alerting") continue;

        for (const alert of rule.alerts || []) {
            const alertRow = {
                groupName: group.name,
                namespace: group.file,

                ruleName: rule.name,

                state: alert.state,
                activeAt: alert.activeAt,
                value: alert.value || "",
            };

            if (typeof alert.labels === "object") {
                for (const [key, value] of Object.entries(alert.labels)) {
                    const name = `label_${key}`;
                    if (!labelNames.has(name)) {
                        labelNames.add(name);
                        metadataLabels.push({
                            name,
                            shape: shapeForValue(value),
                            displayName: `${key} (label)`,
                        });
                    }
                    alertRow[name] = value;
                }
            }
            if (typeof alert.annotations === "object") {
                for (const [key, value] of Object.entries(alert.annotations)) {
                    const annotationName = `annotation_${key}`;
                    if (!annotationNames.has(annotationName)) {
                        annotationNames.add(annotationName);
                        metadataAnnotations.push({
                            name: annotationName,
                            shape: shapeForValue(value),
                            displayName: `${key} (annotation)`,
                        });
                    }
                    alertRow[annotationName] = value;
                }
            }

            result.push(alertRow);
        }
    }
}

metadata = [...metadataBase, ...metadataLabels, ...metadataAnnotations];
