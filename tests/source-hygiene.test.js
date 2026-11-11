import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';

const root = new URL('..', import.meta.url);

function javascriptFiles() {
    return readdirSync(root, {recursive: true, encoding: 'utf8'}).filter(
        name =>
            name.endsWith('.js') &&
            !name.startsWith('.git/') &&
            !name.startsWith('node_modules/'),
    );
}

test('source comments contain no literal \\n escapes that swallow code', () => {
    const broken = [];

    for (const name of javascriptFiles()) {
        const lines = readFileSync(new URL(name, root), 'utf8').split('\n');
        lines.forEach((line, index) => {
            // A real line comment should never carry the two characters
            // backslash+n followed by another comment marker: that means a
            // multi-line comment was written with escaped newlines and the
            // code after it stayed commented out.
            if (/\\n\s+\/\//.test(line)) broken.push(`${name}:${index + 1}`);
        });
    }

    assert.deepEqual(broken, [], `literal \\n inside comments: ${broken.join(', ')}`);
});
