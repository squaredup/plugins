// Checkmk 2.3 returns { time_range, step, metrics: [{ title, data_points }] }; older releases
// used curves/rrddata. Points are evenly spaced `step` seconds apart from time_range.start, and
// null where the RRD has no value yet.
const toMs = (t) => (typeof t === 'number' ? t * 1000 : Date.parse(t));

const range = (data && data.time_range) || {};
const start = toMs(range.start);
const stepMs = ((data && data.step) || 60) * 1000;
const curves = (data && (data.metrics || data.curves)) || [];
const hostName = context.objects && context.objects[0] ? context.objects[0].rawId : null;

result = [];
curves.forEach((curve) => {
    (curve.data_points || curve.rrddata || []).forEach((value, i) => {
        if (value !== null && value !== undefined && !isNaN(start)) {
            result.push({
                timestamp: new Date(start + i * stepMs).toISOString(),
                value,
                hostName,
                metric: curve.title
            });
        }
    });
});
