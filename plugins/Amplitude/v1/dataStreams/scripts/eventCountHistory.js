// dataStreams/scripts/eventCountHistory.js
// Amplitude returns two/three parallel arrays (dates + one series per group
// + group labels) rather than one row per date, so a post-request script is
// required to zip them together.
//
// Ungrouped (no groupByProperty set): data.series has exactly one array
// (one row per date, groupValue omitted) - this is today's existing,
// unchanged behavior.
//
// Grouped (groupByProperty set, via an embedded `group_by` on the `e` param):
// data.series has one array per distinct property value, and
// data.seriesLabels holds the label for each series - as an
// [eventIndex, label] tuple (since group_by is embedded per-event), not a
// bare string. Zip each series against xValues and tag every row with its
// group's label.
//
// Whether the request was grouped is read from context.config.groupByProperty
// (the tile's own selection), not from series.length - a grouped property
// that only has one distinct value in range still returns exactly one
// series, and series.length alone can't tell that apart from "ungrouped".
const xValues = (data.data && data.data.xValues) || [];
const series = (data.data && data.data.series) || [];
const seriesLabels = (data.data && data.data.seriesLabels) || [];

const groupByProperty = context.config && context.config.groupByProperty;
const isGrouped = Boolean(groupByProperty && groupByProperty[0] && groupByProperty[0].value);

if (!isGrouped) {
    // Ungrouped - identical output shape to before this change.
    const values = series[0] || [];
    result = xValues.map((date, i) => ({
        date,
        eventCount: values[i],
        groupValue: null,
    }));
} else {
    result = series.flatMap((values, seriesIndex) => {
        const label = seriesLabels[seriesIndex];
        const groupValue = Array.isArray(label) ? label[1] : label;
        return xValues.map((date, i) => ({
            date,
            eventCount: values[i],
            groupValue,
        }));
    });
}
