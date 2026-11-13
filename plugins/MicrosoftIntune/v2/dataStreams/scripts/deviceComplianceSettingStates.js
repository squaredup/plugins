// One row per compliance setting evaluated on the scoped managed device.
// Graph lists the device's policy states with an empty settingStates array, so the settings come from
// a second request per policy (.../deviceCompliancePolicyStates/{policyId}/settingStates). The first
// request lists the policies, and this script chains the settings requests through pagingContext.
// The policies still to fetch, and their names, travel in the URL fragment, which is not sent to Graph.
// Runs once per page, so the de-duplication only covers this page.
const device = (context.objects && context.objects[0]) || {};
const config = context.config || {};
const includeCompliant = config.includeCompliant === true || config.includeCompliant === "true";
const passing = new Set(["compliant", "notApplicable"]);

const base = `https://graph.microsoft.com/v1.0/deviceManagement/managedDevices/${encodeURIComponent(device.rawId)}/deviceCompliancePolicyStates`;

const readState = (link) => {
    const hash = typeof link === "string" ? link.indexOf("#q=") : -1;
    if (hash < 0) {
        return [];
    }
    try {
        const queue = JSON.parse(decodeURIComponent(link.slice(hash + 3)));
        return Array.isArray(queue) ? queue : [];
    } catch (e) {
        return [];
    }
};
const withState = (link, queue) => `${link.split("#")[0]}#q=${encodeURIComponent(JSON.stringify(queue))}`;

let queue = readState(context.pagingContext);
const items = (data && data.value) || [];
const isSettingsPage = /\/settingStates$/.test((url && url.pathname) || "");
const rows = [];

if (isSettingsPage) {
    // The policy these settings belong to is at the front of the queue.
    const current = queue[0] || {};
    const seen = new Set();
    for (const s of items) {
        if (!includeCompliant && passing.has(s.state)) {
            continue;
        }
        const source = (Array.isArray(s.sources) && s.sources[0]) || {};
        const settingId = s.settingName || s.setting || null;
        const row = {
            state: s.state || null,
            settingName: settingId,
            setting: settingId,
            policyName: current.name || source.displayName || null,
            policyId: current.id || source.id || null,
            currentValue: s.currentValue === undefined || s.currentValue === "" ? null : s.currentValue,
            // Graph reports "no error" as error code 0 with the description "0".
            errorCode: s.errorCode ? s.errorCode : null,
            errorDescription: s.errorDescription && s.errorDescription !== "0" ? s.errorDescription : null,
            userPrincipalName: s.userPrincipalName || null,
            deviceName: device.name || null,
            deviceId: device.rawId || null
        };
        const key = JSON.stringify(row);
        if (!seen.has(key)) {
            seen.add(key);
            rows.push(row);
        }
    }
} else {
    // Graph repeats a policy once per assignment, so queue each policy once. A policy that is
    // compliant or not applicable has no failing settings, so it is skipped unless compliant
    // settings are wanted.
    const queued = new Set(queue.map((p) => p.id));
    for (const p of items) {
        if (!p.id || queued.has(p.id) || (!includeCompliant && passing.has(p.state))) {
            continue;
        }
        queued.add(p.id);
        queue.push({ id: p.id, name: p.displayName || null });
    }
}

result = rows;

// Follow Graph's own next page first. After the last page of a policy's settings, move on to the next policy.
const nextLink = data && data["@odata.nextLink"];
if (!nextLink && isSettingsPage) {
    queue.shift();
}
if (nextLink) {
    pagingContext = withState(nextLink, queue);
} else if (queue.length) {
    pagingContext = withState(`${base}/${encodeURIComponent(queue[0].id)}/settingStates`, queue);
} else {
    pagingContext = undefined;
}
