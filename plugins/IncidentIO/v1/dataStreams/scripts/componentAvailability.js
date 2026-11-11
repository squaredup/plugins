// dataStreams/scripts/componentAvailability.js
// Single object response. availability_percent is a string like "99.94" (0-100) and is omitted
// when there is no data for the window.
const component = context.objects[0];
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const a = data.availability || {};
const pct = a.availability_percent === undefined || a.availability_percent === null ? null : Number(a.availability_percent);

let availabilityState = 'unknown';
if (pct !== null && !Number.isNaN(pct)) {
    availabilityState = pct >= 99.9 ? 'success' : pct >= 99 ? 'warning' : 'error';
}

result = [
    {
        componentName: unwrap(component.name),
        groupName: unwrap(component.groupName) || null,
        availabilityPercent: pct,
        availabilityState,
        dataAvailableSince: a.data_available_since || null,
        startAt: a.start_at || null,
        endAt: a.end_at || null,
    },
];
