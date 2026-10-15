// A post-request script is required for this stream (unusually - most streams should
// use pathToData instead) for two reasons that can't be expressed declaratively:
//  1. The row location is chosen by the user per tile. `config.pathToData` is a single
//     static string baked into the stream, so it cannot follow a path that changes with
//     the query; only a script can read the user's value from `context.config`.
//  2. Cloudflare answers a failed GraphQL query with HTTP 200 and a populated `errors`
//     array, so the request never looks like a failure and `errorHandling` never fires.
//     Without this script a broken query silently shapes to zero rows.
// It also flattens the nested GraphQL group shape (dimensions/sum/avg/uniq/quantiles)
// into dot-notation columns, matching the other Cloudflare analytics streams.

const body = data || {};

const graphqlErrors = Array.isArray(body.errors) ? body.errors : [];
if (graphqlErrors.length) {
    const messages = graphqlErrors
        .map((e) => (e && e.message) || JSON.stringify(e))
        .filter(Boolean);
    throw new Error('Cloudflare GraphQL error: ' + messages.join(' | '));
}

// Every array in the response, as a dot path - used to make path errors actionable.
const arrayPaths = (node, prefix, depth, found) => {
    if (depth > 6 || node === null || typeof node !== 'object') return found;
    if (Array.isArray(node)) {
        if (prefix) found.push(prefix);
        if (node.length) arrayPaths(node[0], prefix + '.0', depth + 1, found);
        return found;
    }
    for (const key of Object.keys(node)) {
        arrayPaths(node[key], prefix ? prefix + '.' + key : key, depth + 1, found);
    }
    return found;
};

const candidates = () => {
    const paths = arrayPaths(body, '', 0, []);
    return paths.length
        ? ' Arrays available in this response: ' + paths.join(', ')
        : ' This response contains no arrays.';
};

const walk = (root, path) =>
    path
        .split('.')
        .filter((segment) => segment.length)
        .reduce(
            (node, key) => (node === null || node === undefined ? undefined : node[key]),
            root
        );

const requestedPath = String(
    (context && context.config && context.config.pathToData) || ''
).trim();

if (!requestedPath) {
    throw new Error('Set "Path to rows" to the path of the array of rows in the query response.' + candidates());
}

// Tolerate a path written with or without the leading `data.` envelope.
let rows = walk(body, requestedPath);
if (rows === undefined) rows = walk(body.data, requestedPath);

if (rows === undefined || rows === null) {
    throw new Error('Nothing found at "' + requestedPath + '".' + candidates());
}
if (!Array.isArray(rows)) {
    rows = [rows];
}

const flatten = (value, prefix, out) => {
    for (const key of Object.keys(value)) {
        const child = value[key];
        const name = prefix ? prefix + '.' + key : key;
        if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
            flatten(child, name, out);
        } else {
            out[name] = child;
        }
    }
    return out;
};

result = rows.map((row) =>
    row !== null && typeof row === 'object' && !Array.isArray(row)
        ? flatten(row, '', {})
        : { value: row }
);
