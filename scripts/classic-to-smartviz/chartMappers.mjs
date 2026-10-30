import { findColumn, findFieldType, findSoleColumnOfType, getColumnTitle, isKnownColumn, isTimeLikeName } from './columns.mjs';

/** The classic Y-axis "Count (Built-in)" option. */
const BUILT_IN_COUNT = 'builtin_count_by_label';

const LEGEND_POSITIONS = new Set(['top', 'bottom', 'left', 'right']);

const REDUCTION_AGGREGATES = { sum: 'sum', mean: 'avg', avg: 'avg', min: 'min', max: 'max', count: 'count' };

const isSet = (value) => value !== undefined && value !== null && value !== '' && value !== 'auto' && value !== 'none';

const toList = (value) => (Array.isArray(value) ? value : isSet(value) ? [value] : []);

/** A channel for a column, typed from its declared shape or, failing that, from the role the channel plays. */
const toChannel = ({ columns }, field, fallbackType, extra = {}) => ({
    field,
    type: findFieldType(columns, field) ?? fallbackType,
    ...extra
});

/** A configured column the tile still has, or `undefined` (with a note) when it is unset or gone. */
const findConfiguredColumn = (tileColumns, configured, label, notes) => {
    if (!isSet(configured)) {
        return undefined;
    }

    if (isKnownColumn(tileColumns, configured)) {
        return configured;
    }

    notes.push(`${label} column ${configured} no longer exists, so SmartViz picks one as classic did`);

    return undefined;
};

/** The x channel of a line or bar chart, or `undefined` to let SmartViz pick the x column itself. */
const toXChannel = (tileColumns, configured, chartType, notes) => {
    const field = findConfiguredColumn(tileColumns, configured, 'x', notes);

    if (!field) {
        return undefined;
    }

    const declaredType = findFieldType(tileColumns.columns, field);

    if (declaredType) {
        return { field, type: declaredType };
    }

    const guessedType = chartType === 'line' || isTimeLikeName(field) ? 'temporal' : 'nominal';
    notes.push(`x column ${field} has no declared shape; typed as ${guessedType}`);

    return { field, type: guessedType };
};

/**
 * The y channel. Several y columns only convert when they are every numeric column the chart would plot
 * anyway, because SmartViz plots either one y column or all numeric columns.
 */
const toYEncoding = (tileColumns, configured, xField, notes) => {
    const yColumns = toList(configured);

    if (yColumns[0] === BUILT_IN_COUNT) {
        return xField
            ? { y: { field: xField, type: 'quantitative', aggregate: 'count', title: 'Count' } }
            : { blockedReason: 'counts rows with no x column set' };
    }

    const fields = yColumns
        .filter((name) => name !== BUILT_IN_COUNT)
        .map((name) => findConfiguredColumn(tileColumns, name, 'y', notes))
        .filter(Boolean);

    if (fields.length <= 1) {
        return fields.length === 1 ? { y: toChannel(tileColumns, fields[0], 'quantitative') } : {};
    }

    const { columns, isComplete } = tileColumns;
    const plottedByDefault = columns
        .filter((column) => column.isVisible && column.name !== xField && findFieldType(columns, column.name) === 'quantitative')
        .map((column) => column.name);
    const isEveryNumericColumn =
        isComplete && plottedByDefault.length === fields.length && fields.every((name) => plottedByDefault.includes(name));

    return isEveryNumericColumn
        ? {}
        : { blockedReason: `plots ${fields.length} of the stream's numeric columns; SmartViz plots one or all of them` };
};

/**
 * Legend and axis-title style shared by line and bar. `autoTitleAxes` lists the axes classic gives a default
 * title when the title is switched on with no text.
 */
const toLegendAndAxisStyle = (classicConfig, autoTitleAxes) => {
    const xTitle = classicConfig.xAxisLabel;
    const yTitle = classicConfig.yAxisLabel;
    const showsXTitle =
        classicConfig.showXAxisLabel !== false && Boolean(xTitle || (classicConfig.showXAxisLabel === true && autoTitleAxes.x));
    const showsYTitle =
        classicConfig.showYAxisLabel !== false && Boolean(yTitle || (classicConfig.showYAxisLabel === true && autoTitleAxes.y));

    return {
        ...(classicConfig.showLegend === false
            ? { legendPosition: 'none' }
            : LEGEND_POSITIONS.has(classicConfig.legendPosition) && { legendPosition: classicConfig.legendPosition }),
        ...(showsXTitle && { cartesianShowXAxisTitle: true, ...(xTitle && { cartesianXAxisTitle: xTitle }) }),
        ...(showsYTitle && { cartesianShowYAxisTitle: true, ...(yTitle && { cartesianYAxisTitle: yTitle }) }),
        ...(classicConfig.showGrid === false && { cartesianShowHorizontalGridLines: false })
    };
};

/** Classic's line range modes: `auto` (the default) fits the data, `fit` anchors at zero. */
const toLineRangeStyle = (classicConfig) => {
    switch (classicConfig.yAxisRangeMode ?? 'auto') {
        case 'auto':
            return { cartesianYAxisRangeMode: 'fit' };
        case 'percentage':
            return { cartesianYAxisRangeMode: 'percentage' };
        case 'custom':
            return {
                ...(typeof classicConfig.yAxisRangeFrom === 'number' && { cartesianYAxisMin: classicConfig.yAxisRangeFrom }),
                ...(typeof classicConfig.yAxisRangeTo === 'number' && { cartesianYAxisMax: classicConfig.yAxisRangeTo })
            };
        default:
            return {};
    }
};

const toVisualization = (chartType, encoding, style, notes) => ({
    spec: { chartType, encoding, ...(Object.keys(style).length > 0 && { style }) },
    notes
});

const toCartesianEncoding = (x, y, seriesField) => ({
    ...(x && { x }),
    ...(y && { y }),
    ...(seriesField && { series: { field: seriesField, type: 'nominal' } })
});

/** Converts a classic `data-stream-line-graph` config to a line spec. */
export const toLineChart = (classicConfig, tileColumns) => {
    const notes = [];
    const x = toXChannel(tileColumns, classicConfig.xAxisColumn, 'line', notes);
    const { y, blockedReason } = toYEncoding(tileColumns, classicConfig.yAxisColumn, x?.field, notes);

    if (blockedReason) {
        return { blockedReason };
    }

    const seriesField = findConfiguredColumn(tileColumns, classicConfig.seriesColumn, 'series', notes);

    /** A gradient under every line of a chart split into many series hides the lines, so only unsplit charts keep it. */
    const hasArea = classicConfig.shading !== false && !seriesField;

    if (classicConfig.shading !== false && seriesField) {
        notes.push('area shading dropped because the lines are split by series');
    }

    const style = {
        ...toLegendAndAxisStyle(classicConfig, { x: false, y: true }),
        ...toLineRangeStyle(classicConfig),
        ...(!classicConfig.dataPoints && { cartesianSymbol: 'none' }),
        ...(hasArea && { cartesianAreaGradient: true }),
        ...(classicConfig.cumulative === true && { cartesianCumulative: true }),
        ...(classicConfig.showTrendLine === true && { cartesianTrendLine: true }),
        ...(typeof classicConfig.decimalPlaces === 'number' && { cartesianYAxisDecimalPlaces: classicConfig.decimalPlaces }),
        ...(isSet(classicConfig.unitLabelColumn) && { cartesianYAxisUnitColumn: classicConfig.unitLabelColumn })
    };

    return toVisualization('line', toCartesianEncoding(x, y, seriesField), style, notes);
};

const PALETTE_RULE = /^(?:bar|series)Index\s*%\s*(\d+)\s*==\s*(\d+)$/u;
const LABEL_RULE = /^label\s*==\s*["'](.+?)["']$/u;
const SERIES_RULE = /^series\s*==\s*["'](.+?)["']$/u;
const VALUE_RULE = /^value\s*(>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)$/u;
const VALUE_OPERATORS = { '>': 'gt', '>=': 'gte', '<': 'lt', '<=': 'lte' };

/** Converts one classic colour expression, or returns `undefined` when SmartViz has no equivalent. */
const toColorRule = ({ color, expression }) => {
    const trimmed = expression.trim();
    const series = SERIES_RULE.exec(trimmed)?.[1];
    const label = LABEL_RULE.exec(trimmed)?.[1];
    const value = VALUE_RULE.exec(trimmed);

    if (series) {
        return { mappedColor: [series, color] };
    }

    if (label) {
        return { colorRule: { label, color } };
    }

    return value ? { colorRule: { [VALUE_OPERATORS[value[1]]]: Number(value[2]), color } } : undefined;
};

/** Converts classic custom bar colours to SmartViz colour style, noting any rule it cannot express. */
const toBarColorStyle = (colorState, notes) => {
    const rules = (colorState?.type === 'custom' ? (colorState.customColors ?? []) : []).filter(
        (rule) => rule.color && rule.expression
    );

    if (rules.length === 0) {
        return {};
    }

    const paletteMatches = rules.map((rule) => PALETTE_RULE.exec(rule.expression.trim()));

    if (paletteMatches.every(Boolean)) {
        const colors = paletteMatches
            .map((match, index) => ({ remainder: Number(match[2]), color: rules[index].color }))
            .sort((a, b) => a.remainder - b.remainder)
            .map(({ color }) => color);

        return { colors };
    }

    const converted = rules.map((rule) => ({ rule, result: toColorRule(rule) }));

    converted
        .filter(({ result }) => !result)
        .forEach(({ rule }) => notes.push(`colour rule not converted: ${rule.expression.trim()} → ${rule.color}`));

    const mappedColors = Object.fromEntries(converted.map(({ result }) => result?.mappedColor).filter(Boolean));
    const colorRules = converted.map(({ result }) => result?.colorRule).filter(Boolean);

    return {
        ...(Object.keys(mappedColors).length > 0 && { mappedColors }),
        ...(colorRules.length > 0 && { cartesianColorRules: colorRules })
    };
};

const toBarStackStyle = (classicConfig, seriesField) => {
    if (classicConfig.displayMode === 'percentage') {
        return { cartesianStack: 'normalize' };
    }

    if (classicConfig.displayMode === 'cumulative') {
        return { cartesianCumulative: true };
    }

    if (!seriesField) {
        return {};
    }

    return { cartesianStack: classicConfig.grouping === true ? 'off' : 'on' };
};

/** Converts a classic `data-stream-bar-chart` config to a bar spec. */
export const toBarChart = (classicConfig, tileColumns) => {
    const notes = [];
    const x = toXChannel(tileColumns, classicConfig.xAxisData, 'bar', notes);
    const { y, blockedReason } = toYEncoding(tileColumns, classicConfig.yAxisData, x?.field, notes);

    if (blockedReason) {
        return { blockedReason };
    }

    const seriesField = findConfiguredColumn(tileColumns, classicConfig.xAxisGroup, 'group', notes);
    const range = classicConfig.range;

    const style = {
        ...toLegendAndAxisStyle(classicConfig, { x: true, y: true }),
        ...toBarStackStyle(classicConfig, seriesField),
        ...(classicConfig.horizontalLayout === 'horizontal' && { cartesianHorizontal: true }),
        ...(classicConfig.showValue === true && { showLabels: true }),
        ...(classicConfig.showTotals === true && { cartesianShowStackedTotals: true }),
        ...(range?.type === 'custom' && typeof range.minimum === 'number' && { cartesianYAxisMin: range.minimum }),
        ...(range?.type === 'custom' && typeof range.maximum === 'number' && { cartesianYAxisMax: range.maximum }),
        ...toBarColorStyle(classicConfig.color, notes)
    };

    return toVisualization('bar', toCartesianEncoding(x, y, seriesField), style, notes);
};

/**
 * Reads a classic scalar or gauge `value`: a column name, or a reduction `{ type, columns }` over all rows.
 * A value column the tile no longer has falls back to its only numeric column, as classic's default does.
 * A count needs a field to point at, so it borrows any column the tile is known to have.
 */
const toValueChannel = (value, tileColumns, notes) => {
    if (typeof value === 'string' && isSet(value)) {
        if (isKnownColumn(tileColumns, value)) {
            return { channel: toChannel(tileColumns, value, 'quantitative') };
        }

        const replacement = findSoleColumnOfType(tileColumns, 'quantitative');

        if (!replacement) {
            return { blockedReason: `value column ${value} no longer exists` };
        }

        notes.push(`value column ${value} no longer exists; using ${replacement}`);

        return { channel: toChannel(tileColumns, replacement, 'quantitative') };
    }

    const aggregate = REDUCTION_AGGREGATES[value?.type];

    if (aggregate === 'count') {
        const anyField = value.columns?.[0] ?? tileColumns.columns[0]?.name;

        return anyField
            ? { channel: { field: anyField, type: 'quantitative', aggregate: 'count', title: 'Count' } }
            : { blockedReason: 'counts rows, and the stream declares no column to count' };
    }

    if (aggregate && value.columns?.length === 1) {
        return { channel: toChannel(tileColumns, value.columns[0], 'quantitative', { aggregate }) };
    }

    return { blockedReason: 'value column is set to auto' };
};

/** Converts a classic `data-stream-scalar` config to a scalar spec. */
export const toScalar = (classicConfig, tileColumns) => {
    const notes = [];
    const { channel, blockedReason } = toValueChannel(classicConfig.value, tileColumns, notes);

    if (blockedReason) {
        return { blockedReason };
    }

    const comparisonField = findConfiguredColumn(tileColumns, classicConfig.comparisonColumn, 'comparison', notes);
    const labelPosition = classicConfig.labelPosition;

    if (!findColumn(tileColumns.columns, channel.field)) {
        notes.push(`value column ${channel.field} is not declared by the stream; typed as a number`);
    }

    const style = {
        ...(typeof classicConfig.label === 'string' && classicConfig.label && { scalarLabelText: classicConfig.label }),
        ...(labelPosition && labelPosition !== 'bottom' && { scalarLabelPosition: labelPosition })
    };

    const encoding = {
        values: [channel],
        ...(comparisonField && { comparison: toChannel(tileColumns, comparisonField, 'quantitative') })
    };

    return toVisualization('scalar', encoding, style, notes);
};

/** Converts a classic `data-stream-gauge` config to a gauge spec. */
export const toGauge = (classicConfig, tileColumns) => {
    const notes = [];
    const { channel, blockedReason } = toValueChannel(classicConfig.value, tileColumns, notes);

    if (blockedReason) {
        return { blockedReason };
    }

    const minimumField = findConfiguredColumn(tileColumns, classicConfig.minimumColumn, 'minimum', notes);
    const maximumField = findConfiguredColumn(tileColumns, classicConfig.maximumColumn, 'maximum', notes);

    const style = {
        ...(typeof classicConfig.minimum === 'number' && { gaugeMin: classicConfig.minimum }),
        ...(typeof classicConfig.maximum === 'number' && { gaugeMax: classicConfig.maximum }),
        ...(classicConfig.label && { gaugeLabelText: String(classicConfig.label) })
    };

    const encoding = {
        value: { ...channel, type: 'quantitative' },
        ...(minimumField && { min: toChannel(tileColumns, minimumField, 'quantitative') }),
        ...(maximumField && { max: toChannel(tileColumns, maximumField, 'quantitative') })
    };

    return toVisualization('gauge', encoding, style, notes);
};

/**
 * The donut's value channel: a count of rows per label for classic's "Count (Built-in)", the configured
 * column, or the tile's only numeric column when the configured one is gone.
 */
const toDonutValue = (classicConfig, tileColumns, labelField, notes) => {
    const configured = classicConfig.valueColumn;

    if (configured === BUILT_IN_COUNT) {
        return { field: labelField, type: 'quantitative', aggregate: 'count', title: 'Count' };
    }

    const field = isKnownColumn(tileColumns, configured) ? configured : findSoleColumnOfType(tileColumns, 'quantitative');

    if (!field) {
        return undefined;
    }

    if (field !== configured) {
        notes.push(`value column ${configured} no longer exists; using ${field}`);
    }

    return { field, type: 'quantitative', aggregate: 'sum', title: getColumnTitle(tileColumns.columns, field) };
};

/** Converts a classic `data-stream-donut-chart` config to a donut-style pie spec. */
export const toDonut = (classicConfig, tileColumns) => {
    const notes = [];

    if (!isSet(classicConfig.labelColumn) || !isSet(classicConfig.valueColumn)) {
        return { blockedReason: 'label or value column is set to auto' };
    }

    if (!isKnownColumn(tileColumns, classicConfig.labelColumn)) {
        return { blockedReason: `label column ${classicConfig.labelColumn} no longer exists` };
    }

    const value = toDonutValue(classicConfig, tileColumns, classicConfig.labelColumn, notes);

    if (!value) {
        return { blockedReason: `value column ${classicConfig.valueColumn} no longer exists` };
    }

    const style = {
        pieInnerRadius: 60,
        pieDonutCenterValue: classicConfig.hideCenterValue === true ? 'none' : 'total',
        labelFontSize: 16,
        ...(classicConfig.legendMode === 'table' && { pieLegendStyle: 'table' })
    };

    const encoding = { label: { field: classicConfig.labelColumn, type: 'nominal' }, value };

    return toVisualization('pie', encoding, style, notes);
};
