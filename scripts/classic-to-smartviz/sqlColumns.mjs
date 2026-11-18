const IDENTIFIER = String.raw`(?:"(?:[^"]|"")+"|[A-Za-z_][A-Za-z0-9_$]*)`;
const COLUMN_REFERENCE = new RegExp(String.raw`^(?:${IDENTIFIER}\s*\.\s*)*(${IDENTIFIER})$`, 'u');
const EXPLICIT_ALIAS = new RegExp(String.raw`^[\s\S]*\S\s+AS\s+(${IDENTIFIER})$`, 'iu');
const IMPLICIT_ALIAS = new RegExp(String.raw`^[\s\S]*[\w")\]']\s+(${IDENTIFIER})$`, 'u');

/** Words that can end an unaliased expression, so are never read as an implicit alias. */
const TRAILING_KEYWORDS = new Set(['end', 'asc', 'desc', 'null', 'true', 'false', 'first', 'last']);

const unquote = (identifier) => (identifier.startsWith('"') ? identifier.slice(1, -1).replaceAll('""', '"') : identifier);

/** The SQL with comments removed and every string literal blanked, so neither can hide a keyword, comma or bracket. */
const toScannable = (sql) =>
    sql
        .replace(/--[^\n]*/gu, ' ')
        .replace(/\/\*[\s\S]*?\*\//gu, ' ')
        .replace(/'(?:[^']|'')*'/gu, "''");

/**
 * The positions, outside brackets and quoted identifiers, where `pattern` matches the text from that point on. A
 * keyword only matches at the start of a word.
 */
const findTopLevel = (text, pattern, isKeyword = false) => {
    const positions = [];
    let depth = 0;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];

        if (character === '"') {
            index = text.indexOf('"', index + 1);
            if (index === -1) {
                break;
            }
        } else if (character === '(') {
            depth += 1;
        } else if (character === ')') {
            depth -= 1;
        } else if (depth === 0 && !(isKeyword && /\w/u.test(text[index - 1] ?? '')) && pattern.test(text.slice(index))) {
            positions.push(index);
        }
    }

    return positions;
};

/** The name DuckDB gives one select-list item, or `undefined` when it names it after the expression itself. */
const toOutputName = (item) => {
    const explicit = EXPLICIT_ALIAS.exec(item)?.[1];

    if (explicit) {
        return unquote(explicit);
    }

    const reference = COLUMN_REFERENCE.exec(item)?.[1];

    if (reference) {
        return unquote(reference);
    }

    const implicit = IMPLICIT_ALIAS.exec(item)?.[1];

    return implicit && !TRAILING_KEYWORDS.has(implicit.toLowerCase()) ? unquote(implicit) : undefined;
};

/**
 * The columns a SQL tile's query returns, read from its outermost select list (the first one, for a UNION).
 * `isComplete` is false when an item's name can't be read, such as `*` or an unaliased expression, so the
 * list only rules a name out when it's complete.
 */
export const readSqlColumnNames = (sql) => {
    const text = toScannable(String(sql));
    const select = findTopLevel(text, /^select\b/iu, true)[0];

    if (select === undefined) {
        return { names: [], isComplete: false };
    }

    const afterSelect = text.slice(select + 'select'.length).replace(/^\s+distinct(?:\s+on\s*\([^)]*\))?/iu, '');
    const end = findTopLevel(afterSelect, /^(?:from|union|intersect|except|order\s+by|limit|where|group\s+by)\b/iu, true)[0];
    const selectList = afterSelect.slice(0, end ?? afterSelect.length);
    const commas = findTopLevel(selectList, /^,/u);
    const items = [-1, ...commas]
        .map((start, index) => selectList.slice(start + 1, commas[index] ?? selectList.length).trim())
        .filter(Boolean);
    const names = items.map(toOutputName);

    return { names: names.filter(Boolean), isComplete: names.length > 0 && names.every(Boolean) };
};
