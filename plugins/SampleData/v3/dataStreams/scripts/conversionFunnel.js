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

const days = Math.max(1 / 24, span / DAY);
const visitors = 5200 * 0.78 * 60 * 24 * days;
// Visitors are left out: at ~100x the next stage they flatten the funnel
const stages = [
    ["Signups", 0.011],
    ["Trials Started", 0.0072],
    ["Activated", 0.0041],
    ["Paid", 0.0017],
];
result = stages.map(([stage, ratio], i) => ({
    order: i + 1,
    stage,
    count: Math.round(visitors * ratio * (1 + 0.05 * wave(`funnel:${stage}`, windowEnd))),
}));
