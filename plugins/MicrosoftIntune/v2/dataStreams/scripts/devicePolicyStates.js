// One row per policy state for the scoped managed device. Graph repeats a policy once per assignment
// (user and setting combination), so identical rows are dropped. Runs once per page, so the de-duplication
// only covers this page.
const device = (context.objects && context.objects[0]) || {};
const seen = new Set();
const rows = [];

for (const s of (data && data.value) || []) {
    const row = {
        state: s.state || null,
        policyName: s.displayName || null,
        policyId: s.id || null,
        platformType: s.platformType || null,
        version: typeof s.version === "number" ? s.version : null,
        settingCount: typeof s.settingCount === "number" ? s.settingCount : null,
        deviceName: device.name || null,
        deviceId: device.rawId || null
    };

    const key = JSON.stringify(row);
    if (seen.has(key)) {
        continue;
    }
    seen.add(key);
    rows.push(row);
}

result = rows;
