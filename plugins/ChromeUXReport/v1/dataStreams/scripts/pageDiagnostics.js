// One row per diagnostic, grouped so a tile can filter to the LCP breakdown, the LCP element
// type, how visitors navigated, which devices they used, or their network round trip time
const record = data?.record || {};
const key = record.key || {};
const metrics = record.metrics || {};
const lastDate = record.collectionPeriod?.lastDate;
const periodEnd = lastDate ? new Date(Date.UTC(lastDate.year, lastDate.month - 1, lastDate.day)).toISOString() : null;
const percent = (fraction) => (fraction ?? 0) * 100;

const lcpParts = [
    ["largest_contentful_paint_image_time_to_first_byte", "TTFB", 1],
    ["largest_contentful_paint_image_resource_load_delay", "Load delay", 2],
    ["largest_contentful_paint_image_resource_load_duration", "Load time", 3],
    ["largest_contentful_paint_image_element_render_delay", "Render delay", 4]
];
const navigationNames = {
    navigate: "Navigate",
    navigate_cache: "HTTP cache",
    reload: "Reload",
    restore: "Restore",
    back_forward: "Back/forward",
    back_forward_cache: "bfcache",
    prerender: "Prerender"
};
const fractionRows = (metricKey, group, names) =>
    Object.entries(metrics[metricKey]?.fractions || {}).map(([item, fraction], i) => ({
        group,
        item: names?.[item] || item.charAt(0).toUpperCase() + item.slice(1),
        value: percent(fraction),
        unit: "%",
        order: names ? Object.keys(names).indexOf(item) + 1 : i + 1
    }));

const rows = [
    ...lcpParts
        .filter(([metricKey]) => metrics[metricKey])
        .map(([metricKey, item, order]) => ({ group: "LCP breakdown", item, value: Number(metrics[metricKey].percentiles?.p75), unit: "ms", order })),
    ...fractionRows("largest_contentful_paint_resource_type", "LCP element"),
    ...fractionRows("navigation_types", "Navigation type", navigationNames),
    ...fractionRows("form_factors", "Device"),
    ...(metrics.round_trip_time
        ? [{ group: "Network", item: "Round trip time", value: Number(metrics.round_trip_time.percentiles?.p75), unit: "ms", order: 1 }]
        : [])
];

result = rows.filter((row) => Number.isFinite(row.value)).map((row) => ({
    target: key.url || key.origin,
    level: key.url ? "Page" : "Whole site",
    device: key.formFactor || "ALL",
    periodEnd,
    ...row
}));
