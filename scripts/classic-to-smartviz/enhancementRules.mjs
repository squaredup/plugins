import { findColumn } from './columns.mjs';

const RECENCY_NAME = /last|seen|updated|modified|checked|heartbeat|sync|refreshed|polled/iu;
const STATUS_NAME = /status|state|health|result|severity|priority|outcome|level|condition/iu;
const SIGNED_NAME = /difference|change|delta|growth|trend|result/iu;

const ERROR = '#DE0038';
const WARNING = '#F59E0B';
const SUCCESS = '#2BB660';
const INFO = '#3B82F6';
const UNKNOWN = '#94A3B8';

/** Health colours for the words status, severity and priority columns commonly hold. Matched whole-value, ignoring case. */
const STATUS_COLORS = {
    critical: ERROR,
    error: ERROR,
    failed: ERROR,
    failure: ERROR,
    down: ERROR,
    offline: ERROR,
    unhealthy: ERROR,
    high: ERROR,
    warning: WARNING,
    warn: WARNING,
    medium: WARNING,
    moderate: WARNING,
    degraded: WARNING,
    partial: WARNING,
    ok: SUCCESS,
    healthy: SUCCESS,
    success: SUCCESS,
    succeeded: SUCCESS,
    passed: SUCCESS,
    up: SUCCESS,
    online: SUCCESS,
    resolved: SUCCESS,
    low: INFO,
    info: INFO,
    informational: INFO,
    unknown: UNKNOWN,
    unmonitored: UNKNOWN,
    'not monitored': UNKNOWN,
    paused: UNKNOWN
};

const getShapeName = ({ tileColumns }, field) => findColumn(tileColumns.columns, field)?.shapeName;

const getLabel = ({ tileColumns }, field) => `${field} ${findColumn(tileColumns.columns, field)?.displayName ?? ''}`;

const withStyle = (spec, style) => ({ ...spec, style: { ...spec.style, ...style } });

const hasColorStyle = (style = {}) =>
    Boolean(style.colors?.length || Object.keys(style.mappedColors ?? {}).length || style.cartesianColorRules?.length);

/** Rewrites the renderer of each richTable column `pick` selects, returning the spec and the fields it changed. */
const updateTableColumns = (spec, pick, toRenderer) => {
    if (spec.chartType !== 'richTable') {
        return { spec, fields: [] };
    }

    const fields = spec.encoding.columns.filter(pick).map((column) => column.field);
    const columns = spec.encoding.columns.map((column) =>
        fields.includes(column.field) ? { ...column, renderer: toRenderer(column.renderer) } : column
    );

    return { spec: { ...spec, encoding: { ...spec.encoding, columns } }, fields };
};

/**
 * Optional improvements applied on top of the like-for-like conversion. Each takes the converted spec and the
 * tile's context, and returns the spec (changed or not) with a note when it changed something. Every rule works
 * from column shapes, names and the converted spec alone, so none of them depends on what the data holds.
 */
export const ENHANCEMENT_RULES = {
    /** Dates of a "last seen / updated / synced" kind show as "3 hours ago", with the exact time in the tooltip. */
    recencyDates: (spec, context) => {
        const { spec: updated, fields } = updateTableColumns(
            spec,
            (column) => column.renderer.type === 'date' && RECENCY_NAME.test(getLabel(context, column.field)),
            (renderer) => ({ ...renderer, relative: true })
        );

        return { spec: updated, note: fields.length > 0 ? `relative time for ${fields.join(', ')}` : undefined };
    },

    /**
     * Donuts and bar or line charts split by a status-like column get health colours for the status words they
     * hold. Values outside the vocabulary keep the palette, and a tile with colours of its own is left alone.
     */
    statusColours: (spec, context) => {
        const { chartType, encoding, style } = spec;
        const candidates = {
            pie: [encoding.label?.field],
            bar: [encoding.series?.field, encoding.x?.field],
            line: [encoding.series?.field]
        }[chartType];
        const statusField = candidates?.find((field) => field && STATUS_NAME.test(getLabel(context, field)));

        if (!statusField || hasColorStyle(style)) {
            return { spec };
        }

        return { spec: withStyle(spec, { mappedColors: STATUS_COLORS }), note: `status colours for ${statusField}` };
    },

    /**
     * Percent columns in tables show as a bar filled to the value out of 100. Columns whose name suggests a signed
     * value (a difference or change) are left as text, because a bar cannot show a negative.
     */
    percentBars: (spec, context) => {
        const { spec: updated, fields } = updateTableColumns(
            spec,
            (column) =>
                column.renderer.type === 'text' &&
                getShapeName(context, column.field) === 'percent' &&
                !SIGNED_NAME.test(getLabel(context, column.field)),
            () => ({ type: 'progress' })
        );

        return { spec: updated, note: fields.length > 0 ? `progress bars for ${fields.join(', ')}` : undefined };
    },

    /** A line chart of a percentage gets a fixed 0–100 axis, unless the tile set its own range. */
    percentAxis: (spec, context) => {
        const { chartType, encoding, style = {} } = spec;
        const hasOwnRange = style.cartesianYAxisMin !== undefined || style.cartesianYAxisMax !== undefined;

        if (chartType !== 'line' || !encoding.y || hasOwnRange || getShapeName(context, encoding.y.field) !== 'percent') {
            return { spec };
        }

        return { spec: withStyle(spec, { cartesianYAxisRangeMode: 'percentage' }), note: 'y axis fixed to 0–100%' };
    },

    /** A gauge of a percentage with no range of its own runs from 0 to 100. */
    percentGauge: (spec, context) => {
        const { chartType, encoding, style = {} } = spec;
        const hasOwnRange =
            style.gaugeMin !== undefined || style.gaugeMax !== undefined || encoding.min !== undefined || encoding.max !== undefined;

        if (chartType !== 'gauge' || hasOwnRange || getShapeName(context, encoding.value.field) !== 'percent') {
            return { spec };
        }

        return { spec: withStyle(spec, { gaugeMin: 0, gaugeMax: 100 }), note: 'gauge range 0–100%' };
    },

    /** Boolean columns read "Yes" / "No" in the table's own text colour, so neither value implies good or bad. */
    booleanLabels: (spec, context) => {
        const { spec: updated, fields } = updateTableColumns(
            spec,
            (column) => column.renderer.type === 'text' && getShapeName(context, column.field) === 'boolean',
            () => ({ type: 'boolean', trueLabel: 'Yes', falseLabel: 'No', trueColor: 'inherit', falseColor: 'inherit' })
        );

        return { spec: updated, note: fields.length > 0 ? `Yes / No for ${fields.join(', ')}` : undefined };
    }
};

export const RULE_NAMES = Object.keys(ENHANCEMENT_RULES);

/** Applies the named rules in order, returning the final spec and the notes of the rules that changed it. */
export const applyEnhancementRules = (spec, context, ruleNames) =>
    ruleNames.reduce(
        (result, name) => {
            const { spec: next, note } = ENHANCEMENT_RULES[name](result.spec, context);

            return { spec: next, applied: note ? [...result.applied, { rule: name, note }] : result.applied };
        },
        { spec, applied: [] }
    );
