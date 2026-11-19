/**
 * The headers the platform infers for columns that declare no display name, ported from `inferDisplayNames` in
 * `@squaredup/data-streams` (`streamData/rawData/ColumnDisplayNames.ts`): the last part of the name, with more
 * of the path added while two names would read the same, then a number when the path runs out.
 */

const formatName = (name) =>
    (name.charAt(0).toUpperCase() + name.slice(1))
        .split(/(?=[A-Z][a-z])|_|-|(?=(?<=[a-z])[A-Z])|\s/gu)
        .map((part) => (/^[^a-z]*$/u.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
        .join(' ');

/** The header for a name from its last `depth` path parts, and how to make it more specific. */
const inferAtDepth = (name, depth) => {
    const parts = name.split('.');
    const joined = parts.reduceRight((tail, part, index) => {
        if (tail === '') {
            return part;
        }

        if (Number.isFinite(Number(tail))) {
            return `${part}[${tail}]`;
        }

        return parts.length - index <= depth ? `${part} / ${tail}` : tail;
    }, '');
    const title = formatName(joined);

    if (depth >= parts.length) {
        return { title, hasMoreContext: false, hasIndex: false, withIndex: (index) => ({ title: `${title} (${index + 1})`, hasMoreContext: false, hasIndex: true }) };
    }

    return { title, hasMoreContext: true, hasIndex: false, withMoreContext: () => inferAtDepth(name, depth + 1) };
};

const findDuplicateIndexes = (inferred) =>
    inferred.flatMap((entry, index) => (inferred.filter((other) => other.title === entry.title).length > 1 ? [index] : []));

const ensureUnique = (inferred) => {
    const duplicateIndexes = findDuplicateIndexes(inferred);

    if (duplicateIndexes.length === 0) {
        return inferred;
    }

    const withMoreContext = duplicateIndexes.map((index) => (inferred[index].hasMoreContext ? inferred[index].withMoreContext() : inferred[index]));
    const titles = withMoreContext.map((entry) => entry.title);
    const hasDuplicatesLeft = new Set(titles).size !== titles.length;
    const resolved = hasDuplicatesLeft
        ? ensureUnique(
              duplicateIndexes.map((index) => {
                  const entry = inferred[index];

                  if (entry.hasMoreContext) {
                      return entry.withMoreContext();
                  }

                  return entry.hasIndex ? entry : entry.withIndex(index);
              })
          )
        : withMoreContext;

    return inferred.map((entry, index) => {
        const position = duplicateIndexes.indexOf(index);

        return position > -1 ? resolved[position] : entry;
    });
};

/** The header the platform infers for each name, in the same order, unique across the list where it can be. */
export const inferDisplayNames = (names) => ensureUnique(names.map((name) => inferAtDepth(name, 1))).map((entry) => entry.title);
