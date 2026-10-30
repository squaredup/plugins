import fs from 'node:fs';
import path from 'node:path';

const NUMERIC_SHAPES = new Set([
    'number',
    'integer',
    'decimal',
    'percent',
    'currency',
    'bytes',
    'kilobytes',
    'megabytes',
    'gigabytes',
    'terabytes',
    'milliseconds',
    'seconds',
    'minutes',
    'hours',
    'days',
    'duration'
]);

const TIME_LIKE_NAME = /time|date|timestamp|created|updated|started|ended|^ts$|_at$|At$|day|hour|month|week/u;

const AGGREGATE_TITLES = { count: 'Count', sum: 'Sum', mean: 'Average', avg: 'Average', min: 'Minimum', max: 'Maximum' };

/**
 * Splits a column name into the header text the platform shows when a column declares no display name:
 * the last path segment, split on case changes, underscores, hyphens and spaces, each word capitalised.
 */
export const toInferredTitle = (name) => {
    const segments = name.split('.');
    const last = segments[segments.length - 1];
    const leaf = Number.isFinite(Number(last)) && segments.length > 1 ? `${segments[segments.length - 2]}[${last}]` : last;

    return (leaf.charAt(0).toUpperCase() + leaf.slice(1))
        .split(/(?=[A-Z][a-z])|_|-|(?=(?<=[a-z])[A-Z])|\s/gu)
        .filter((part) => part !== '')
        .map((part) => (/^[^a-z]*$/u.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
        .join(' ');
};

const toShape = (metadataEntry) => {
    const [name, config] = Array.isArray(metadataEntry.shape) ? metadataEntry.shape : [metadataEntry.shape, undefined];

    return { shapeName: typeof name === 'string' && name !== '' ? name : undefined, shapeConfig: config };
};

const toColumn = (metadataEntry) => ({
    name: metadataEntry.name,
    displayName: metadataEntry.displayName || undefined,
    role: metadataEntry.role,
    isVisible: metadataEntry.visible !== false,
    isComputed: metadataEntry.computed === true,
    ...toShape(metadataEntry)
});

/** Keeps the first entry for each column name, because a later bare `{ name }` entry only re-asserts the column. */
const toColumnSet = (metadata) => {
    const named = metadata.filter((entry) => typeof entry.name === 'string');
    const columns = named.filter((entry, index) => named.findIndex((other) => other.name === entry.name) === index).map(toColumn);

    return { columns, isComplete: !metadata.some((entry) => entry.pattern !== undefined) };
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

/**
 * Reads the declared columns of every data stream in a plugin version folder, from `dataStreams/*.json` (low-code
 * plugins) or `data_streams.json` and its `rowTypes` (packaged plugins). A stream that declares no columns maps to
 * `undefined`. `isComplete` is false when a `pattern` entry lets undeclared columns through.
 */
export const readStreamColumns = (pluginDirectory) => {
    const lowCodeDirectory = path.join(pluginDirectory, 'dataStreams');
    const lowCodeStreams = fs.existsSync(lowCodeDirectory)
        ? fs
              .readdirSync(lowCodeDirectory)
              .filter((file) => file.endsWith('.json'))
              .map((file) => readJson(path.join(lowCodeDirectory, file)))
              .map((stream) => [stream.name, Array.isArray(stream.metadata) ? toColumnSet(stream.metadata) : undefined])
        : [];

    const packagedFile = path.join(pluginDirectory, 'data_streams.json');
    const packaged = fs.existsSync(packagedFile) ? readJson(packagedFile) : undefined;
    const rowTypeMetadataByName = new Map((packaged?.rowTypes ?? []).map((rowType) => [rowType.name, rowType.metadata]));
    const packagedStreams = (packaged?.dataStreams ?? []).map(({ definition = {} }) => {
        const metadata = definition.metadata ?? rowTypeMetadataByName.get(definition.rowType);

        return [definition.name, Array.isArray(metadata) ? toColumnSet(metadata) : undefined];
    });

    return new Map([...lowCodeStreams, ...packagedStreams]);
};

const STREAM_REFERENCE = /\{\{\s*dataStreams\.\[?([^}\]]+?)\]?\s*\}\}/u;

/** Returns the plugin stream name a tile reads, or `undefined` for a built-in stream such as SQL or properties. */
export const getStreamName = (tileConfig) => {
    const dataStream = tileConfig.dataStream ?? {};

    return STREAM_REFERENCE.exec(dataStream.id ?? '')?.[1] ?? (dataStream.id ? undefined : dataStream.name);
};

/** True for a tile on the built-in object properties stream, whose columns are the scoped object's properties. */
export const isPropertiesTile = (tileConfig) =>
    tileConfig.dataStream?.id === 'datastream-properties' || tileConfig.dataStream?.name === 'properties';

/** A group's `by` is one `[column, grouper]` pair, a list of them, or empty. */
const toByPairs = (by) => {
    if (!Array.isArray(by) || by.length === 0) {
        return [];
    }

    return Array.isArray(by[0]) ? by.filter((pair) => typeof pair[0] === 'string') : [by];
};

/** A row count with no column is named `count`; any other aggregate is `<column>_<type>`. */
const toGroupedColumns = (group, sourceColumns) => {
    const byPairs = toByPairs(group.by);
    const sourceTitle = (name) => sourceColumns.find((column) => column.name === name)?.displayName ?? toInferredTitle(name);

    const keyColumns = byPairs.map(([name, grouper]) => ({
        name: `${name}_${grouper}`,
        displayName: sourceTitle(name),
        isVisible: true,
        groupKind: /^(by|time)/iu.test(grouper) ? 'temporal' : 'nominal'
    }));
    const aggregateColumns = (group.aggregate ?? []).flatMap(({ type, names, name }) => {
        const columnNames = Array.isArray(names) ? names : name ? [name] : [];
        const toAggregateColumn = (columnName) => ({
            name: columnName ? `${columnName}_${type}` : type,
            displayName: columnName ? `${sourceTitle(columnName)} (${AGGREGATE_TITLES[type] ?? type})` : (AGGREGATE_TITLES[type] ?? type),
            isVisible: true,
            groupKind: 'quantitative'
        });

        return columnNames.length > 0 ? columnNames.map(toAggregateColumn) : [toAggregateColumn(undefined)];
    });

    return [...keyColumns, ...aggregateColumns];
};

/** Applies a tile's `dataStream.metadata` over the stream's columns: matching names are re-shaped, new names added. */
const overlayColumns = (streamColumns, tileMetadata) => {
    const tileColumns = toColumnSet(tileMetadata).columns;
    const overlaid = streamColumns.map((column) => {
        const override = tileMetadata.find((entry) => entry.name === column.name);

        if (!override) {
            return column;
        }

        return {
            ...column,
            ...(override.shape !== undefined && toShape(override)),
            ...(override.displayName && { displayName: override.displayName }),
            ...(override.role && { role: override.role }),
            ...(override.visible !== undefined && { isVisible: override.visible !== false })
        };
    });
    const added = tileColumns.filter((column) => !findColumn(streamColumns, column.name));

    return [...overlaid, ...added];
};

/**
 * Resolves the columns a tile's data will have: the post-group names when the tile groups, otherwise the
 * stream's declared columns with the tile's own `dataStream.metadata` applied over them. `isComplete` is true
 * only when every column the data can have is known.
 */
export const getTileColumns = (tileConfig, streamColumnsByName) => {
    const dataStream = tileConfig.dataStream ?? {};
    const streamColumns = streamColumnsByName.get(getStreamName(tileConfig));
    const tileMetadata = Array.isArray(dataStream.metadata) ? dataStream.metadata : [];

    if (dataStream.group?.by?.length || dataStream.group?.aggregate?.length) {
        return { columns: toGroupedColumns(dataStream.group, streamColumns?.columns ?? []), isComplete: true, source: 'group' };
    }

    if (!streamColumns) {
        return { columns: overlayColumns([], tileMetadata), isComplete: false, source: tileMetadata.length ? 'tile metadata' : 'none' };
    }

    return { columns: overlayColumns(streamColumns.columns, tileMetadata), isComplete: streamColumns.isComplete, source: 'stream metadata' };
};

/** Finds a column by name, or `undefined` when the column was not declared. */
export const findColumn = (columns, name) => columns.find((column) => column.name === name);

/** The header a column shows: an explicit override, its declared display name, or the platform's inferred name. */
export const getColumnTitle = (columns, name, overrides = {}) =>
    overrides[name] || findColumn(columns, name)?.displayName || toInferredTitle(name);

/**
 * The SmartViz field type of a declared column, or `undefined` when the column or its shape is unknown.
 * Callers fall back to the type the channel's role implies.
 */
export const findFieldType = (columns, name) => {
    const column = findColumn(columns, name);

    if (column?.groupKind) {
        return column.groupKind;
    }

    if (!column?.shapeName) {
        return undefined;
    }

    if (column.shapeName === 'date') {
        return 'temporal';
    }

    return NUMERIC_SHAPES.has(column.shapeName) ? 'quantitative' : 'nominal';
};

/**
 * True unless the tile's full column list is known and the name is not on it. Columns the platform expands
 * from object values at run time (`name[Expanded].…`) are never declared, so they count as known.
 */
export const isKnownColumn = ({ columns, isComplete }, name) =>
    !isComplete || Boolean(findColumn(columns, name)) || name.includes('[Expanded]');

/** The tile's only visible column of a field type, or `undefined` when there are none or several. */
export const findSoleColumnOfType = ({ columns }, type) => {
    const matches = columns.filter((column) => column.isVisible && findFieldType(columns, column.name) === type);

    return matches.length === 1 ? matches[0].name : undefined;
};

/** Guesses whether an x-axis column holds time values from its name, for columns with no declared shape. */
export const isTimeLikeName = (name) => TIME_LIKE_NAME.test(name);
