#!/usr/bin/env node
// Usage: node normalize.js <dashboard.json> [scopes.json] [--scope-name "Scope Name"]
// Writes normalized dashboard JSON to stdout.
// Pass scopes.json for perspective dashboards (those with config.variables or config.scope).
// If scopes.json has multiple entries, --scope-name is required to select which one to apply.

const fs = require('fs');

const args = process.argv.slice(2);
const scopeNameFlag = args.indexOf('--scope-name');
const requestedScopeName = scopeNameFlag !== -1 ? args[scopeNameFlag + 1] : null;
const positional = args.filter((a, i) => {
  if (a.startsWith('--')) return false;
  if (scopeNameFlag !== -1 && i === scopeNameFlag + 1) return false;
  return true;
});

const dashboardPath = positional[0];
const scopesPath = positional[1];

if (!dashboardPath) {
  process.stderr.write(
    'Usage: node normalize.js <dashboard.json> [scopes.json] [--scope-name "Scope Name"]\n'
  );
  process.exit(1);
}

const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));
const allScopes = scopesPath ? JSON.parse(fs.readFileSync(scopesPath, 'utf8')) : null;

let scopeEntry = null;
if (allScopes) {
  if (allScopes.length === 1) {
    scopeEntry = allScopes[0];
  } else if (requestedScopeName) {
    scopeEntry = allScopes.find(s => s.name === requestedScopeName);
    if (!scopeEntry) {
      const available = allScopes.map(s => `  "${s.name}"`).join('\n');
      process.stderr.write(
        `No scope named "${requestedScopeName}". Available:\n${available}\n`
      );
      process.exit(1);
    }
  } else {
    const available = allScopes.map(s => `  "${s.name}"`).join('\n');
    process.stderr.write(
      `scopes.json has multiple entries — use --scope-name to select one:\n${available}\n`
    );
    process.exit(1);
  }
}

const scopeName = scopeEntry?.name;
const variableName = scopeEntry?.variable?.name;

function normalizeTile(tile) {
  const config = structuredClone(tile.config);
  if (!config) return tile;

  // Remove scope entries that pin to specific nodes via ids_defaultScopeIds
  if (Array.isArray(config.scopes)) {
    config.scopes = config.scopes.filter(
      s => !(s.bindings && 'ids_defaultScopeIds' in s.bindings)
    );
    if (config.scopes.length === 0) delete config.scopes;
  }

  // Templatize dataStream
  if (config.dataStream) {
    // Leave global built-in data streams (e.g. datastream-properties) untouched —
    // their id is not plugin-specific, so it stays as-is.
    const isGlobalDataStream = config.dataStream.id === 'datastream-properties';
    if (config.dataStream.name && !isGlobalDataStream) {
      config.dataStream.id = `{{dataStreams.[${config.dataStream.name}]}}`;
    }
    if (config.dataStream.pluginConfigId) {
      config.dataStream.pluginConfigId = '{{configId}}';
    }
  }

  if (config.activePluginConfigIds) {
    config.activePluginConfigIds = ['{{configId}}'];
  }

  // Perspective fields
  if (config.variables && variableName) {
    config.variables = [`{{variables.[${variableName}]}}`];
  }

  if (config.scope) {
    if (config.scope.variable && variableName) {
      config.scope.variable = `{{variables.[${variableName}]}}`;
    }
    if (config.scope.workspace) {
      config.scope.workspace = '{{workspaceId}}';
    }
    if (config.scope.scope && scopeName) {
      config.scope.scope = `{{scopes.[${scopeName}]}}`;
    }
  }

  return { ...tile, config };
}

// String-level pass: catch any remaining hardcoded IDs the structural pass may miss
// (e.g. inside scope.query strings)
function globalReplace(obj) {
  let s = JSON.stringify(obj);
  s = s.replace(/config-[A-Za-z0-9]+/g, '{{configId}}');
  s = s.replace(/space-[A-Za-z0-9]+/g, '{{workspaceId}}');
  return JSON.parse(s);
}

const normalized = globalReplace({
  ...dashboard,
  // Always start plugin default content at version 1, regardless of the
  // version the dashboard had in the platform.
  version: 1,
  contents: (dashboard.contents || []).map(normalizeTile),
});

process.stdout.write(JSON.stringify(normalized, null, 2) + '\n');
