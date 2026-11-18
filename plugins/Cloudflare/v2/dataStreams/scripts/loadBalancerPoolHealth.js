// The pool health endpoint returns a doubly-nested map keyed by colo and then
// by origin name, which config cannot flatten - expandInnerObjects only reaches
// one level, and the keys are dynamic. Flatten to one row per origin per colo.
const popHealth = (data && data.result && data.result.pop_health) || {};

const rows = [];
for (const colo of Object.keys(popHealth)) {
    const pop = popHealth[colo] || {};
    for (const entry of pop.origins || []) {
        for (const originName of Object.keys(entry || {})) {
            const o = entry[originName] || {};
            rows.push({
                colo: colo,
                origin: originName,
                // Absent health is unknown, not unhealthy - Boolean() would
                // report an origin Cloudflare has no data for as down.
                healthy: typeof o.healthy === "boolean" ? o.healthy : null,
                responseCode:
                    typeof o.response_code === "number"
                        ? o.response_code
                        : null,
                rtt: o.rtt || "",
                failureReason: o.failure_reason || "",
                coloHealthy:
                    typeof pop.healthy === "boolean" ? pop.healthy : null,
            });
        }
    }
}

result = rows;
