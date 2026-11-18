// --- Shared sample-data generator (identical in every script) ---
// Data stream scripts cannot import modules, so each script carries this block.
// Values are deterministic: noise is seeded by a key and an absolute time bucket,
// so history stays stable between refreshes, while the incident is anchored to
// "now" so it is always recent.
const model = data && data.services ? data : JSON.parse(response.body);
const NOW = Date.now();
const MIN = 60000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// Uniform 0..1 from any string key
const rand = (key) => {
    let h = 2166136261;
    const s = String(key);
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    h ^= h >>> 13;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
};

// Smooth value noise in -0.5..0.5, slow drift plus faster wobble
const smooth = (key, t, step) => {
    const i = Math.floor(t / step);
    const f = t / step - i;
    const a = rand(`${key}:${step}:${i}`);
    const b = rand(`${key}:${step}:${i + 1}`);
    const e = f * f * (3 - 2 * f);
    return a + (b - a) * e;
};
const wave = (key, t) => 0.6 * smooth(key, t, 3 * HOUR) + 0.4 * smooth(key, t, 15 * MIN) - 0.5;

// Business-hours load curve, 0.55 overnight to 1.0 at peak (UTC)
const load = (t, peakHourUtc = 15) => {
    const h = (t / HOUR) % 24;
    return 0.775 + 0.225 * Math.cos((2 * Math.PI * (h - peakHourUtc)) / 24);
};

// The headline incident: 0 before it starts, 1 at peak, then a slow recovery
const incident = model.incident;
const incidentStart = NOW - incident.startedMinutesAgo * MIN;
const incidentPeakEnd = NOW - incident.peakEndsMinutesAgo * MIN;
const incidentLevel = (t) => {
    if (t < incidentStart) return 0;
    if (t < incidentStart + 10 * MIN) return (t - incidentStart) / (10 * MIN);
    if (t <= incidentPeakEnd) return 1;
    return Math.exp(-(t - incidentPeakEnd) / (45 * MIN));
};
const serviceImpact = (serviceId, t) =>
    serviceId === incident.service
        ? incidentLevel(t)
        : incident.affectedServices.includes(serviceId)
          ? 0.35 * incidentLevel(t)
          : 0;

// Occasional short historical blips so long timeframes are not flat
const blip = (key, t) => {
    const day = Math.floor(t / DAY);
    if (day >= Math.floor(NOW / DAY) || rand(`${key}:blip:${day}`) > 0.1) return 0;
    const at = day * DAY + rand(`${key}:blipAt:${day}`) * DAY;
    const len = (20 + rand(`${key}:blipLen:${day}`) * 70) * MIN;
    return t >= at && t <= at + len ? 0.3 + 0.4 * rand(`${key}:blipSev:${day}`) : 0;
};

const stateFor = (level) => (level >= 0.5 ? "error" : level >= 0.15 ? "warning" : "success");
const round = (n, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

// Timeframe window and a bucket size that keeps row counts sensible
const tf = context.timeframe || {};
const toMs = (v, unix) => (unix ? unix * 1000 : Date.parse(v));
const windowEnd = Math.min(toMs(tf.end, tf.unixEnd) || NOW, NOW);
const windowStart = toMs(tf.start, tf.unixStart) || windowEnd - DAY;
const span = windowEnd - windowStart;
const bucket =
    span <= 2 * HOUR ? MIN
        : span <= 13 * HOUR ? 5 * MIN
          : span <= 25 * HOUR ? 15 * MIN
            : span <= 8 * DAY ? HOUR
              : span <= 32 * DAY ? 4 * HOUR
                : DAY;
const buckets = (step = bucket) => {
    const out = [];
    for (let t = Math.ceil(windowStart / step) * step; t <= windowEnd; t += step) out.push(t);
    return out;
};
const iso = (t) => new Date(t).toISOString();

// Objects the tile is scoped to; falls back to everything of that kind
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
// Ids of other kinds (e.g. a Service scoping a host stream) are ignored here
const scoped = (items) => {
    const known = new Set(items.map((i) => i.id));
    const ids = new Set((context.objects || []).map((o) => unwrap(o.rawId)).filter((id) => known.has(id)));
    return ids.size ? items.filter((i) => ids.has(i.id)) : items;
};
const byId = (items) => Object.fromEntries(items.map((i) => [i.id, i]));
const services = byId(model.services);
const regions = byId(model.regions);
const teams = byId(model.teams);

// Host, deployment and ticket streams can also be scoped to services (the Service
// perspective); rows are then narrowed to those services
const serviceFilter = new Set((context.objects || []).map((o) => unwrap(o.rawId)).filter((id) => services[id]));
const forService = (serviceId) => serviceFilter.size === 0 || serviceFilter.has(serviceId);

// Golden signals for a service at time t
const stress = (s, t) => Math.min(1, serviceImpact(s.id, t) + blip(s.id, t));
const signals = (s, t) => {
    const k = stress(s, t);
    const w = wave(s.id, t);
    const errorRate = s.errorRate * (1 + 0.8 * w) + k * (s.id === incident.service ? 9 : 3.5);
    return {
        latencyP95Ms: round(s.latencyMs * (1 + 0.18 * w + 0.25 * (load(t) - 0.775)) * (1 + 2.8 * k), 0),
        requestsPerMin: round(s.requestsPerMin * load(t) * (1 + 0.1 * w) * (1 - 0.3 * k), 0),
        errorRatePercent: round(Math.max(0.01, errorRate), 3),
        state: stateFor(k),
    };
};

// Availability over the last 30 days, sampled every 15 minutes. Only server-side
// failures (about a third of all errors) count against the SLO.
const availability30d = (s) => {
    let total = 0;
    let n = 0;
    for (let t = NOW - 30 * DAY; t <= NOW; t += 15 * MIN) {
        total += 100 - 0.3 * signals(s, t).errorRatePercent;
        n++;
    }
    return total / n;
};
// --- End shared block ---

const priorities = [
    { name: "P1", weight: 0.03, slaMinutes: 240 },
    { name: "P2", weight: 0.12, slaMinutes: 480 },
    { name: "P3", weight: 0.45, slaMinutes: 1440 },
    { name: "P4", weight: 0.4, slaMinutes: 4320 },
];
const categoryList = ["Access & Login", "Billing", "Performance", "Bug", "How-to", "Integration"];
const servicePool = model.services.filter((s) => s.tier !== "Tier 3");
const ratePerDay = { Enterprise: 1.4, Business: 0.7, Starter: 0.25 };
const pick = (r, list) => {
    let acc = 0;
    for (const item of list) {
        acc += item.weight;
        if (r < acc) return item;
    }
    return list[list.length - 1];
};
const ticket = (c, seq, key, opened, priority, category, service, resolveFactor) => {
    const resolution = priority.slaMinutes * resolveFactor;
    const age = (NOW - opened) / MIN;
    const resolved = age > resolution;
    const elapsed = resolved ? resolution : age;
    const breached = elapsed > priority.slaMinutes;
    const status = resolved ? (age > resolution + 2 * DAY / MIN ? "Closed" : "Resolved") : age < 30 ? "New" : "In Progress";
    return {
        ticketId: `LUM-${seq}`,
        openedAt: iso(opened),
        customerId: c.id,
        customer: c.name,
        plan: c.plan,
        priority: priority.name,
        category,
        service: service.name,
        team: teams[service.team].name,
        status,
        resolutionMinutes: resolved ? round(resolution, 0) : null,
        slaTargetMinutes: priority.slaMinutes,
        slaBreached: breached,
        slaState: breached ? "error" : !resolved && elapsed > priority.slaMinutes * 0.75 ? "warning" : "success",
    };
};
const rows = [];
const today = Math.floor(NOW / DAY);
for (const c of scoped(model.customers)) {
    // Unique, stable ticket numbers: day, customer and per-day index
    const ci = model.customers.indexOf(c);
    for (let day = Math.floor(windowStart / DAY); day <= Math.min(today, Math.floor((windowEnd - 1) / DAY)); day++) {
        const weekday = new Date(day * DAY).getUTCDay();
        const rate = ratePerDay[c.plan] * (weekday === 0 || weekday === 6 ? 0.25 : 1);
        const count = Math.floor(rate + rand(`${c.id}:tickets:${day}`));
        for (let n = 0; n < count; n++) {
            const key = `${c.id}:${day}:${n}`;
            // Business-hours bias for the day x hour heatmap
            const hour = 7 + Math.floor(Math.pow(rand(`${key}:hour`), 0.9) * 12);
            const opened = day * DAY + hour * HOUR + rand(`${key}:min`) * HOUR;
            if (opened < windowStart || opened > Math.min(windowEnd, NOW)) continue;
            const priority = pick(rand(`${key}:p`), priorities);
            const category = categoryList[Math.floor(rand(`${key}:c`) * categoryList.length)];
            const service = servicePool[Math.floor(rand(`${key}:s`) * servicePool.length)];
            if (!forService(service.id)) continue;
            rows.push(ticket(c, (day % 10000) * 200 + ci * 10 + n, key, opened, priority, category, service, 0.1 + Math.pow(rand(`${key}:res`), 2)));
        }
    }
    // Tickets raised by customers hit by the incident
    if (incident.affectedCustomers.includes(c.id) && forService(incident.service)) {
        const opened = incidentStart + (12 + rand(`${c.id}:inc`) * 25) * MIN;
        if (opened >= windowStart && opened <= windowEnd) {
            rows.push({
                ...ticket(c, (Math.floor(opened / DAY) % 10000) * 200 + ci * 10 + 9, `${c.id}:incident`, opened, priorities[0], "Performance", services[incident.service], 9),
                category: "Payments Failing",
            });
        }
    }
}
result = rows.sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1));
