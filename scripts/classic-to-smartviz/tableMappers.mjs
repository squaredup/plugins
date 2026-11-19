import { findColumn, getColumnTitle, isKnownColumn } from './columns.mjs';

const MAX_TABLE_COLUMNS = 50;
const MAX_HIDDEN_COLUMNS = 100;

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
 * The columns a classic table shows, in order. Classic shows every column that isn't hidden: a `hiddenColumns`
 * list decides that outright, and without one the stream's own `visible` flags do. `columnOrder` only orders
 * them; the columns it leaves out follow in stream order. Names the data no longer has are dropped. When the
 * stream does not declare its full column list, an uncustomised table is left `isAutomatic` for SmartViz to
 * find its columns in the data, as classic does, and so is one that hides columns, with `hiddenNames` to hide.
 * So is an uncustomised SQL table, whose select list names its columns but not their shapes. Any other
 * customised table lists the columns it can name, so any the stream doesn't declare, which classic would also
 * show, are left out.
 */
const getShownColumnNames = (classicConfig, tileColumns, notes) => {
    const { columns, isComplete, source } = tileColumns;
    const hasHiddenList = Array.isArray(classicConfig.hiddenColumns);
    const hiddenColumns = new Set(hasHiddenList ? classicConfig.hiddenColumns : []);
    const columnOrder = Array.isArray(classicConfig.columnOrder) ? classicConfig.columnOrder : [];
    const isCustomised =
        hiddenColumns.size > 0 || columnOrder.length > 0 || Object.keys(classicConfig.columnDisplayNames ?? {}).length > 0;

    if ((!isComplete || source === 'sql') && !isCustomised) {
        return { isAutomatic: true };
    }

    /**
     * Classic shows every column but the hidden ones, and an open column list can hold columns no name here
     * reaches, so the table stays automatic and hides classic's list. Not when classic's column order shows a
     * column the stream hides, which an automatic table leaves out.
     */
    const streamHiddenInOrder = columnOrder.filter((name) => {
        const column = findColumn(columns, name);

        return column && !column.isVisible && !hiddenColumns.has(name);
    });

    /** A column the stream already hides needs no entry. */
    const namesToHide = [...hiddenColumns].filter((name) => findColumn(columns, name)?.isVisible !== false);

    if (!isComplete && hiddenColumns.size > 0 && streamHiddenInOrder.length === 0 && namesToHide.length <= MAX_HIDDEN_COLUMNS) {
        const declaredOrder = columnOrder.filter((name) => !hiddenColumns.has(name) && findColumn(columns, name));
        const streamOrder = columns.map((column) => column.name).filter((name) => declaredOrder.includes(name));
        const hasOwnOrder = declaredOrder.join('\n') !== streamOrder.join('\n');
        const hasUndeclaredOrder = columnOrder.some((name) => !hiddenColumns.has(name) && !findColumn(columns, name));
        const renamedNames = Object.entries(classicConfig.columnDisplayNames ?? {})
            .filter(([name, title]) => title && !hiddenColumns.has(name))
            .map(([name]) => name);

        if (hasOwnOrder) {
            notes.push("columns follow the data's order, not classic's column order");
        } else if (hasUndeclaredOrder) {
            notes.push("columns the stream doesn't declare follow the data's order, which may differ from classic's");
        }

        if (renamedNames.length > 0) {
            notes.push(`headers classic renames keep their own names: ${renamedNames.join(', ')}`);
        }

        return { isAutomatic: true, hiddenNames: namesToHide };
    }

    /**
     * A column the stream doesn't declare is only known from `columnOrder`, and shows unless hidden. Classic's
     * editor saves every column it shows into `columnOrder`, so a column the stream hides that isn't there was
     * added or hidden after the tile was saved: it stays hidden, as the editor would have hidden it.
     */
    const isShown = (name) => {
        const column = findColumn(columns, name);

        if (!hasHiddenList) {
            return column ? column.isVisible : !isComplete;
        }

        return !hiddenColumns.has(name) && (!column || column.isVisible || columnOrder.includes(name));
    };
    const shownNames = columns.filter((column) => isShown(column.name)).map((column) => column.name);
    const orderedNames = columnOrder.filter((name) => isShown(name) && (!isComplete || findColumn(columns, name)));
    const staleNames = isComplete ? columnOrder.filter((name) => !hiddenColumns.has(name) && !findColumn(columns, name)) : [];

    if (staleNames.length > 0) {
        notes.push(`dropped column(s) the tile no longer has: ${staleNames.join(', ')}`);
    }

    if (!isComplete) {
        notes.push('the stream does not declare every column, so columns classic shows beyond these are not listed');
    }

    return { names: [...orderedNames, ...shownNames.filter((name) => !orderedNames.includes(name))] };
};

const getRowLinkField = (classicConfig) => {
    const rowLink = classicConfig.rowLinkColumnName;
    const field = typeof rowLink === 'string' ? rowLink : rowLink?.value;

    return field && field !== 'None' ? field : undefined;
};

/** Converts a classic `data-stream-table` config to a richTable spec. */
export const toRichTable = (classicConfig, tileColumns) => {
    const notes = [];
    const { names, isAutomatic, hiddenNames = [], blockedReason } = getShownColumnNames(classicConfig, tileColumns, notes);

    if (blockedReason) {
        return { blockedReason };
    }

    const rowLinkField = getRowLinkField(classicConfig);
    const style = {
        ...(classicConfig.transpose === true && { richTableTranspose: true }),
        ...(rowLinkField && isKnownColumn(tileColumns, rowLinkField) && { richTableRowLinkField: rowLinkField }),
        ...(hiddenNames.length > 0 && { richTableHiddenColumns: hiddenNames })
    };
    const withStyle = (encoding) => ({ chartType: 'richTable', encoding, ...(Object.keys(style).length > 0 && { style }) });

    if (isAutomatic) {
        const shownNote = hiddenNames.length > 0 ? 'shows every column the data has but the ones classic hides' : 'shows every column the data has, as classic does';

        return { spec: withStyle({}), notes: [...notes, shownNote] };
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

    if (undeclaredNames.length > 0) {
        notes.push(`header and renderer inferred for undeclared column(s): ${undeclaredNames.join(', ')}`);
    }

    return {
        spec: withStyle({
            columns: names.map((name) => ({
                field: name,
                title: getColumnTitle(columns, name, displayNameOverrides),
                renderer: toRenderer(findColumn(columns, name)),
                ...toMappedStateColumn(findColumn(columns, name))
            }))
        }),
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

/**
 * Converts a classic `data-stream-blocks` config to a statusGrid spec. Classic fits its columns to the number of
 * blocks (up to 3) where SmartViz always uses 3, so a tile scoped to the dashboard's object, which shows one
 * block, gets one column.
 */
export const toStatusGrid = (classicConfig, tileColumns, tileConfig = {}) => {
    const notes = [];

    const labelField = resolveColumn(tileColumns, classicConfig.labelColumn, (column) => column.role === 'label', 'label', notes);

    if (!labelField) {
        notes.push('label column left for SmartViz to pick, as classic does');
    }

    const statusField =
        classicConfig.stateColumn === 'none'
            ? undefined
            : resolveColumn(tileColumns, classicConfig.stateColumn, (column) => column.shapeName === 'state', 'state', notes);

    /**
     * Classic draws blocks with no state in grey, and so does a status grid with no status, unless the data has a
     * state column it can take.
     */
    if (!statusField) {
        const stateColumn = tileColumns.columns.find((column) => column.isVisible && column.shapeName === 'state');

        notes.push(
            stateColumn
                ? `blocks are coloured by ${stateColumn.name}, which SmartViz finds for a grid with no status; classic draws them grey`
                : 'blocks have no state, so they are grey, as classic draws them'
        );
    }

    const isUrlColumn = (column) => column.role === 'link' || column.shapeName === 'url';
    const configuredLinkField = resolveColumn(tileColumns, classicConfig.linkColumn, isUrlColumn, 'link', notes);
    const configuredLinkColumn = configuredLinkField && findColumn(tileColumns.columns, configuredLinkField);

    /**
     * A SmartViz link opens the column's text as a URL. Classic links a block to the object behind a column that
     * isn't a URL, which SmartViz does without a link, so a column declared as an object name or a non-URL shape is
     * dropped. One with no declared shape is kept, as the platform may infer a URL from its values.
     */
    const isKnownNotUrl =
        configuredLinkColumn &&
        !isUrlColumn(configuredLinkColumn) &&
        (configuredLinkColumn.isObjectName || configuredLinkColumn.shapeName !== undefined);
    const linkField = isKnownNotUrl ? undefined : configuredLinkField;

    if (configuredLinkField && !linkField) {
        notes.push(`link column ${configuredLinkField} is not a URL, so blocks link to their object as classic does`);
    }

    const groupField = resolveColumn(tileColumns, classicConfig.groupBy, () => false, 'group', notes);
    const orderField = resolveColumn(tileColumns, classicConfig.orderBy, () => false, 'order', notes);
    const sublabelField = resolveColumn(tileColumns, classicConfig.sublabel, () => false, 'sublabel', notes);
    const blockHeight = Number(classicConfig.blockHeight);

    const columnsPerRow = typeof classicConfig.columns === 'number' ? classicConfig.columns : tileConfig.scope?.variable ? 1 : undefined;

    const style = {
        ...(columnsPerRow && { statusGridColumnsPerRow: columnsPerRow }),
        ...(sublabelField && { statusGridSecondaryTemplate: toRawTemplate(toTemplateReference(sublabelField)) }),
        ...(classicConfig.wrapLabels === true && { statusGridLabelWrap: true }),
        ...(orderField && { statusGridOrderByField: orderField }),
        ...(blockHeight >= 50 && blockHeight <= 310 && { statusGridMaxBlockHeight: Math.round(blockHeight) })
    };

    return {
        spec: {
            chartType: 'statusGrid',
            encoding: {
                ...(labelField && { label: toNominalChannel(labelField) }),
                ...(statusField && { status: toNominalChannel(statusField) }),
                ...(groupField && { group: toNominalChannel(groupField) }),
                ...(linkField && { link: toNominalChannel(linkField) })
            },
            ...(Object.keys(style).length > 0 && { style })
        },
        notes: [
            ...notes,
            ...(!labelField || findColumn(tileColumns.columns, labelField) ? [] : [`label column ${labelField} is not declared by the stream`])
        ]
    };
};
