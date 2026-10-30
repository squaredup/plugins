#!/usr/bin/env node
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { toBarChart, toDonut, toGauge, toLineChart, toScalar } from './chartMappers.mjs';
import { getTileColumns, isKnownColumn, isPropertiesTile, readStreamColumns } from './columns.mjs';
import { replaceMembers } from './jsonEdit.mjs';
import { applyEnhancementRules, RULE_NAMES } from './enhancementRules.mjs';
import { toRichTable, toStatusGrid } from './tableMappers.mjs';

const USAGE = `Converts classic data-stream tiles in plugin default dashboards to SmartViz (vizSpec) tiles.

Usage: node scripts/classic-to-smartviz/convert.mjs [options] <pluginVersionFolder>...

Options:
  --write            Write the converted dashboards (default: report only)
  --bump <level>     With --write, bump metadata.json by patch or minor in each folder that changed
  --schema <file>    CommonJS build of @squaredup/viz-spec (or a bundle exporting vizSpecSchema) to validate
                     every spec against; a spec that fails is left classic
  --rules <names>    Enhancement rules to apply on top of the conversion: all (the default), none, or a
                     comma-separated list of ${RULE_NAMES.join(', ')}
  --json <file>      Also write the report as JSON`;

const MAPPERS = {
    'data-stream-table': toRichTable,
    'data-stream-blocks': toStatusGrid,
    'data-stream-line-graph': toLineChart,
    'data-stream-bar-chart': toBarChart,
    'data-stream-scalar': toScalar,
    'data-stream-gauge': toGauge,
    'data-stream-donut-chart': toDonut
};

const STYLE_FIELD_KEYS = ['richTableRowLinkField', 'statusGridOrderByField', 'cartesianYAxisUnitColumn', 'cartesianY2AxisField'];

const findDashboardFiles = (directory) =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            return findDashboardFiles(entryPath);
        }

        return entry.name.endsWith('.dash.json') ? [entryPath] : [];
    });

const findDefaultContentDirectory = (pluginDirectory) =>
    ['defaultContent', 'DefaultContent'].map((name) => path.join(pluginDirectory, name)).find((candidate) => fs.existsSync(candidate));

/** Every column name a spec refers to: encoding channels, table columns and their link labels, and style fields. */
const getSpecFields = (visualization) => {
    const channels = Object.values(visualization.encoding ?? {}).flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
    const encodingFields = channels.flatMap((channel) => [channel?.field, channel?.renderer?.labelField]);
    const styleFields = STYLE_FIELD_KEYS.map((key) => visualization.style?.[key]);

    return [...new Set([...encodingFields, ...styleFields].filter((field) => typeof field === 'string'))];
};

const getKeyPaths = (value, prefix = '') =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? Object.entries(value).flatMap(([key, child]) => [`${prefix}${key}`, ...getKeyPaths(child, `${prefix}${key}.`)])
        : Array.isArray(value)
          ? value.flatMap((item, index) => getKeyPaths(item, `${prefix}${index}.`))
          : [];

/**
 * Schema-checks a spec, returning the problems as text. Zod drops keys it does not know without failing,
 * so a key missing from the parsed result counts as a problem too.
 */
const getSchemaProblems = (vizSpecSchema, spec) => {
    const result = vizSpecSchema.safeParse(spec);

    if (!result.success) {
        return result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    }

    const keptPaths = new Set(getKeyPaths(result.data));

    return getKeyPaths(spec)
        .filter((keyPath) => !keptPaths.has(keyPath))
        .map((keyPath) => `${keyPath}: dropped by the schema`);
};

const toIndentUnit = (text) => /\n([ \t]+)"/u.exec(text)?.[1] ?? '    ';

/** Converts one tile, returning its report entry and, when it converts, the spec to write. */
const convertTile = (tileConfig, streamColumnsByName, { vizSpecSchema, ruleNames }) => {
    const title = tileConfig.title || '(untitled)';

    if (tileConfig.vizSpec) {
        return { title, status: 'skipped', reason: 'already SmartViz' };
    }

    if (isPropertiesTile(tileConfig)) {
        return { title, status: 'skipped', reason: 'built-in properties stream stays classic' };
    }

    const classicType = tileConfig.visualisation?.type;
    const mapper = MAPPERS[classicType];

    if (!mapper) {
        return { title, status: 'skipped', reason: `no converter for ${classicType ?? 'a tile with no visualisation'}` };
    }

    const tileColumns = getTileColumns(tileConfig, streamColumnsByName);
    const { spec: visualization, notes = [], blockedReason } = mapper(tileConfig.visualisation.config?.[classicType] ?? {}, tileColumns);

    if (blockedReason) {
        return { title, classicType, status: 'blocked', reason: blockedReason };
    }

    const enhanced = applyEnhancementRules(visualization, { tileColumns, tileConfig }, ruleNames);
    const spec = { version: '1.0', visualization: enhanced.spec };
    const schemaProblems = vizSpecSchema ? getSchemaProblems(vizSpecSchema, spec) : [];

    if (schemaProblems.length > 0) {
        return { title, classicType, status: 'blocked', reason: `invalid spec: ${schemaProblems.join('; ')}` };
    }

    const unknownFields = getSpecFields(enhanced.spec).filter((field) => !isKnownColumn(tileColumns, field));

    if (unknownFields.length > 0) {
        return { title, classicType, status: 'blocked', reason: `refers to columns the tile does not have: ${unknownFields.join(', ')}` };
    }

    return {
        title,
        classicType,
        status: 'converted',
        chartType: visualization.chartType,
        columnSource: tileColumns.source,
        notes,
        rulesApplied: enhanced.applied,
        spec
    };
};

const convertDashboard = (filePath, streamColumnsByName, { vizSpecSchema, ruleNames, write }) => {
    const text = fs.readFileSync(filePath, 'utf8');
    const contents = JSON.parse(text).dashboard?.contents ?? [];

    const tiles = contents
        .map((item, index) => ({ index, config: item?.config }))
        .filter(({ config }) => config?._type === 'tile/data-stream')
        .map(({ index, config }) => ({ index, ...convertTile(config, streamColumnsByName, { vizSpecSchema, ruleNames }) }));

    const replacements = tiles
        .filter((tile) => tile.status === 'converted')
        .map((tile) => ({
            memberPath: ['dashboard', 'contents', tile.index, 'config', 'visualisation'],
            key: 'vizSpec',
            value: tile.spec,
            indentUnit: toIndentUnit(text)
        }));

    if (write && replacements.length > 0) {
        fs.writeFileSync(filePath, replaceMembers(text, replacements));
    }

    return { file: filePath, tiles: tiles.map(({ spec, index, ...tile }) => tile) };
};

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/u;

/** Bumps the `version` in a plugin folder's metadata.json in place, returning the old and new versions. */
const bumpVersion = (pluginDirectory, level) => {
    const metadataPath = path.join(pluginDirectory, 'metadata.json');
    const text = fs.readFileSync(metadataPath, 'utf8');
    const { version } = JSON.parse(text);
    const [, major, minor, patch] = SEMVER.exec(version) ?? [];

    if (major === undefined) {
        throw new Error(`${metadataPath}: version ${version} is not x.y.z`);
    }

    const nextVersion = level === 'minor' ? `${major}.${Number(minor) + 1}.0` : `${major}.${minor}.${Number(patch) + 1}`;
    fs.writeFileSync(metadataPath, text.replace(`"version": "${version}"`, `"version": "${nextVersion}"`));

    return { from: version, to: nextVersion };
};

const STATUS_MARKS = { converted: '✔', blocked: '✖', skipped: '·' };

const printReport = (plugins) => {
    for (const plugin of plugins) {
        console.log(`\n${plugin.folder}${plugin.version ? `  (${plugin.version.from} → ${plugin.version.to})` : ''}`);

        for (const dashboard of plugin.dashboards) {
            console.log(`  ${path.basename(dashboard.file)}`);

            for (const tile of dashboard.tiles) {
                const detail = tile.status === 'converted' ? `${tile.classicType} → ${tile.chartType}` : tile.reason;
                console.log(`    ${STATUS_MARKS[tile.status]} ${tile.title}: ${detail}`);
                (tile.notes ?? []).forEach((note) => console.log(`        note: ${note}`));
                (tile.rulesApplied ?? []).forEach(({ rule, note }) => console.log(`        rule ${rule}: ${note}`));
            }
        }
    }

    const tiles = plugins.flatMap((plugin) => plugin.dashboards.flatMap((dashboard) => dashboard.tiles));
    const countOf = (status) => tiles.filter((tile) => tile.status === status).length;
    console.log(`\n${countOf('converted')} converted, ${countOf('blocked')} blocked, ${countOf('skipped')} skipped`);

    const ruleCounts = Object.groupBy(tiles.flatMap((tile) => tile.rulesApplied ?? []), ({ rule }) => rule);
    Object.entries(ruleCounts).forEach(([rule, hits]) => console.log(`  ${rule}: ${hits.length} tile(s)`));
};

/** Reads `--rules`: `all`, `none`, or a comma-separated list of rule names. */
const toRuleNames = (option) => {
    if (option === 'all') {
        return RULE_NAMES;
    }

    if (option === 'none') {
        return [];
    }

    const names = option.split(',').map((name) => name.trim()).filter(Boolean);
    const unknown = names.filter((name) => !RULE_NAMES.includes(name));

    if (unknown.length > 0) {
        throw new Error(`Unknown rule(s): ${unknown.join(', ')}. Rules: ${RULE_NAMES.join(', ')}`);
    }

    return names;
};

const loadVizSpecSchema = (schemaPath) => {
    if (!schemaPath) {
        return undefined;
    }

    const { vizSpecSchema } = createRequire(import.meta.url)(path.resolve(schemaPath));

    if (!vizSpecSchema?.safeParse) {
        throw new Error(`${schemaPath} does not export vizSpecSchema`);
    }

    return vizSpecSchema;
};

const main = () => {
    const { values: options, positionals: folders } = parseArgs({
        allowPositionals: true,
        options: {
            write: { type: 'boolean', default: false },
            bump: { type: 'string' },
            schema: { type: 'string' },
            json: { type: 'string' },
            rules: { type: 'string', default: 'all' },
            help: { type: 'boolean', default: false }
        }
    });

    if (options.help || folders.length === 0) {
        console.log(USAGE);
        process.exit(options.help ? 0 : 1);
    }

    if (options.bump && !['patch', 'minor'].includes(options.bump)) {
        throw new Error('--bump must be patch or minor');
    }

    const vizSpecSchema = loadVizSpecSchema(options.schema);
    const ruleNames = toRuleNames(options.rules);

    const plugins = folders.map((folder) => {
        const defaultContentDirectory = findDefaultContentDirectory(folder);
        const streamColumnsByName = readStreamColumns(folder);
        const dashboards = defaultContentDirectory
            ? findDashboardFiles(defaultContentDirectory).map((file) =>
                  convertDashboard(file, streamColumnsByName, { vizSpecSchema, ruleNames, write: options.write })
              )
            : [];
        const hasConversions = dashboards.some((dashboard) => dashboard.tiles.some((tile) => tile.status === 'converted'));
        const version = options.write && options.bump && hasConversions ? bumpVersion(folder, options.bump) : undefined;

        return { folder, version, dashboards };
    });

    printReport(plugins);

    if (options.json) {
        fs.writeFileSync(options.json, `${JSON.stringify(plugins, null, 4)}\n`);
    }
};

main();
