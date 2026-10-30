/**
 * Parses JSON text into a tree that records where each value, and each object member's key, starts and ends,
 * so a member can be replaced without reformatting the rest of the file.
 */
const parseTree = (text) => {
    let position = 0;

    const skipWhitespace = () => {
        while (/\s/u.test(text[position] ?? '')) {
            position++;
        }
    };

    const fail = (expected) => {
        throw new Error(`Expected ${expected} at offset ${position}`);
    };

    const parseString = () => {
        const start = position;
        position++;

        while (text[position] !== '"') {
            if (position >= text.length) {
                fail('closing quote');
            }

            position += text[position] === '\\' ? 2 : 1;
        }

        position++;

        return JSON.parse(text.slice(start, position));
    };

    const parseValue = () => {
        skipWhitespace();
        const start = position;
        const character = text[position];

        if (character === '{') {
            position++;
            const members = [];
            skipWhitespace();

            while (text[position] !== '}') {
                skipWhitespace();
                const keyStart = position;
                const key = parseString();
                skipWhitespace();
                text[position] === ':' ? position++ : fail(':');
                members.push({ key, keyStart, value: parseValue() });
                skipWhitespace();

                if (text[position] === ',') {
                    position++;
                    skipWhitespace();
                }
            }

            position++;

            return { kind: 'object', start, end: position, members };
        }

        if (character === '[') {
            position++;
            const items = [];
            skipWhitespace();

            while (text[position] !== ']') {
                items.push(parseValue());
                skipWhitespace();

                if (text[position] === ',') {
                    position++;
                }

                skipWhitespace();
            }

            position++;

            return { kind: 'array', start, end: position, items };
        }

        if (character === '"') {
            parseString();

            return { kind: 'scalar', start, end: position };
        }

        const literal = /^(?:-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/u.exec(text.slice(position));

        if (!literal) {
            fail('a JSON value');
        }

        position += literal[0].length;

        return { kind: 'scalar', start, end: position };
    };

    return parseValue();
};

const getChild = (node, step) =>
    typeof step === 'number' ? node?.items?.[step] : node?.members?.find((member) => member.key === step)?.value;

const getIndent = (text, offset) => {
    const lineStart = text.lastIndexOf('\n', offset - 1) + 1;

    return /^[ \t]*/u.exec(text.slice(lineStart))[0];
};

/**
 * Replaces the member at `memberPath` (keys and array indexes, ending in the member's key) with a new key and
 * value, in place, indenting the new value to match the line the member starts on. Everything else in the
 * text is left byte for byte. Replacements are applied from the end of the file backwards, so their offsets
 * stay valid.
 */
export const replaceMembers = (text, replacements) => {
    const tree = parseTree(text);

    const edits = replacements.map(({ memberPath, key, value, indentUnit = '    ' }) => {
        const parent = memberPath.slice(0, -1).reduce(getChild, tree);
        const member = parent?.members?.find((candidate) => candidate.key === memberPath[memberPath.length - 1]);

        if (!member) {
            throw new Error(`No member at ${memberPath.join('.')}`);
        }

        const indent = getIndent(text, member.keyStart);
        const serialized = JSON.stringify(value, null, indentUnit).replace(/\n/gu, `\n${indent}`);

        return { start: member.keyStart, end: member.value.end, replacement: `${JSON.stringify(key)}: ${serialized}` };
    });

    return edits
        .sort((a, b) => b.start - a.start)
        .reduce((current, edit) => current.slice(0, edit.start) + edit.replacement + current.slice(edit.end), text);
};
