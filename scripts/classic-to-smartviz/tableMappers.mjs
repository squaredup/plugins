import { findColumn, getColumnTitle, isKnownColumn } from './columns.mjs';

const MAX_TABLE_COLUMNS = 12;

const isSet = (value) => value !== undefined && value !== null && value !== '' && value !== 'auto' && value !== 'none';

/** Wraps a Handlebars template so the platform's install-time templating leaves it for SmartViz to resolve. */
export const toRawTemplate = (template) => `{{{{raw}}}}${template}{{{{/raw}}}}`;

/**
 * A Handlebars reference to a column. A name with dots or brackets (`status[Expanded].rawState`) would read as a
 * path, so it is looked up by its whole name instead.
 */
const toTemplateReference = (name) =>
    /^[A-Za-z_$][\w$]*$/u.test(name) ? `{{${name}}}` : `{{lookup this ${JSON.stringify(name)}}}`;

const COLUMN_REFERENCE = /^\{\{\s*column\.([^}\s]+)\s*\}\}$/u;

const STATE_COLORS = { success: '#2BB660', info: '#3B82F6', warning: '#F59E0B', error: '#DE0038', unknown: '#94A3B8' };

/**
 * A state column that maps its own values to states (`Win` → success) keeps those values in a column the
 * platform adds, `<name>[Expanded].rawState`, which classic tables showed as "<name> (raw)". Shown as a badge
 * coloured by the map, the cell reads "Win" in green rather than "Success".
 */
const toMappedStateColumn = (column) => {
    /** The platform adds the raw copy only for columns read from the response, not for computed ones. */
    const stateMap = column?.shapeName === 'state' && !column.isComputed ? column.shapeConfig?.map : undefined;

    if (!stateMap || typeof stateMap !== 'object' || Object.keys(stateMap).length === 0) {
        return undefined;
    }

    const colors = Object.fromEntries(
        Object.entries(stateMap).flatMap(([state, values]) =>
            STATE_COLORS[state] && Array.isArray(values) ? values.map((value) => [String(value), STATE_COLORS[state]]) : []
        )
    );

    return { field: `${column.name}[Expanded].rawState`, renderer: { type: 'badge', colors } };
};

/**
 * Picks the richTable renderer that shows a column the way the classic table did. Text, date and status
 * renderers show the shape-formatted value, so units and decimals carry over unchanged.
 */
const toRenderer = (column) => {
    switch (column?.shapeName) {
        case 'state':
            return { type: 'status' };
        case 'date':
            return { type: 'date' };
        case 'url': {
            const labelField = COLUMN_REFERENCE.exec(String(column.shapeConfig?.label ?? ''))?.[1];

            return labelField ? { type: 'link', labelField } : { type: 'link' };
        }
        default:
            return { type: 'text' };
    }
};

/**
 * The columns a classic table shows, in order. `columnOrder` is the author's list of shown columns, as the
 * in-product SmartViz migration reads it; `hiddenColumns` always wins. Like classic, names the data no longer
 * has are dropped, and with none left (or no `columnOrder`) every visible column shows.
 */
const getShownColumnNames = (classicConfig, tileColumns, notes) => {
    const hiddenColumns = new Set(classicConfig.hiddenColumns ?? []);
    const columnOrder = (Array.isArray(classicConfig.columnOrder) ? classicConfig.columnOrder : []).filter(
        (name) => !hiddenColumns.has(name)
    );
    const knownNames = columnOrder.filter((name) => isKnownColumn(tileColumns, name));
    const staleNames = columnOrder.filter((name) => !knownNames.includes(name));

    if (staleNames.length > 0) {
        notes.push(`dropped column(s) the tile no longer has: ${staleNames.join(', ')}`);
    }

    if (knownNames.length > 0) {
        return { names: knownNames };
    }

    if (!tileColumns.isComplete) {
        return { blockedReason: 'shows all columns, and the stream does not declare its full column list' };
    }

    return {
        names: tileColumns.columns
            .filter((column) => column.isVisible && !hiddenColumns.has(column.name))
            .map((column) => column.name)
    };
};

const getRowLinkField = (classicConfig) => {
    const rowLink = classicConfig.rowLinkColumnName;
    const field = typeof rowLink === 'string' ? rowLink : rowLink?.value;

    return field && field !== 'None' ? field : undefined;
};

/** Converts a classic `data-stream-table` config to a richTable spec. */
export const toRichTable = (classicConfig, tileColumns) => {
    const notes = [];
    const { names, blockedReason } = getShownColumnNames(classicConfig, tileColumns, notes);

    if (blockedReason) {
        return { blockedReason };
    }

    if (names.length === 0) {
        return { blockedReason: 'no columns to show' };
    }

    if (names.length > MAX_TABLE_COLUMNS) {
        return { blockedReason: `shows ${names.length} columns; a SmartViz table holds at most ${MAX_TABLE_COLUMNS}` };
    }

    const { columns } = tileColumns;
    const displayNameOverrides = classicConfig.columnDisplayNames ?? {};
    const undeclaredNames = names.filter((name) => !findColumn(columns, name));
    const rowLinkField = getRowLinkField(classicConfig);

    if (undeclaredNames.length > 0) {
        notes.push(`header and renderer inferred for undeclared column(s): ${undeclaredNames.join(', ')}`);
    }

    const style = {
        ...(classicConfig.transpose === true && { richTableTranspose: true }),
        ...(rowLinkField && isKnownColumn(tileColumns, rowLinkField) && { richTableRowLinkField: rowLinkField })
    };

    return {
        spec: {
            chartType: 'richTable',
            encoding: {
                columns: names.map((name) => ({
                    field: name,
                    title: getColumnTitle(columns, name, displayNameOverrides),
                    renderer: toRenderer(findColumn(columns, name)),
                    ...toMappedStateColumn(findColumn(columns, name))
                }))
            },
            ...(Object.keys(style).length > 0 && { style })
        },
        notes
    };
};

const toNominalChannel = (field) => ({ field, type: 'nominal' });

/**
 * A configured column if the tile still has it, otherwise the first column `fallback` finds. Classic blocks
 * resolve a missing state or link column the same way.
 */
const resolveColumn = (tileColumns, configured, fallback, label, notes) => {
    if (isSet(configured) && isKnownColumn(tileColumns, configured)) {
        return configured;
    }

    if (isSet(configured)) {
        notes.push(`${label} column ${configured} no longer exists`);
    }

    return tileColumns.columns.find(fallback)?.name;
};

/** Converts a classic `data-stream-blocks` config to a statusGrid spec. */
export const toStatusGrid = (classicConfig, tileColumns) => {
    const notes = [];

    const labelField = resolveColumn(tileColumns, classicConfig.labelColumn, (column) => column.role === 'label', 'label', notes);

    if (!labelField) {
        return { blockedReason: 'no label column the tile still has, and the stream declares no label role' };
    }

    const statusField = resolveColumn(tileColumns, classicConfig.stateColumn, (column) => column.shapeName === 'state', 'state', notes);
    const linkField = resolveColumn(
        tileColumns,
        classicConfig.linkColumn,
        (column) => column.role === 'link' || column.shapeName === 'url',
        'link',
        notes
    );
    const groupField = resolveColumn(tileColumns, classicConfig.groupBy, () => false, 'group', notes);
    const orderField = resolveColumn(tileColumns, classicConfig.orderBy, () => false, 'order', notes);
    const sublabelField = resolveColumn(tileColumns, classicConfig.sublabel, () => false, 'sublabel', notes);
    const blockHeight = Number(classicConfig.blockHeight);

    if (!statusField) {
        notes.push('no state column found; blocks show with no status');
    }

    const style = {
        ...(typeof classicConfig.columns === 'number' && { statusGridColumnsPerRow: classicConfig.columns }),
        ...(sublabelField && { statusGridSecondaryTemplate: toRawTemplate(toTemplateReference(sublabelField)) }),
        ...(classicConfig.wrapLabels === true && { statusGridLabelWrap: true }),
        ...(orderField && { statusGridOrderByField: orderField }),
        ...(blockHeight >= 50 && blockHeight <= 310 && { statusGridMaxBlockHeight: Math.round(blockHeight) })
    };

    return {
        spec: {
            chartType: 'statusGrid',
            encoding: {
                label: toNominalChannel(labelField),
                ...(statusField && { status: toNominalChannel(statusField) }),
                ...(groupField && { group: toNominalChannel(groupField) }),
                ...(linkField && { link: toNominalChannel(linkField) })
            },
            ...(Object.keys(style).length > 0 && { style })
        },
        notes: [...notes, ...(findColumn(tileColumns.columns, labelField) ? [] : [`label column ${labelField} is not declared by the stream`])]
    };
};
