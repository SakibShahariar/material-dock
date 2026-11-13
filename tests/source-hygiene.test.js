import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';

const root = new URL('..', import.meta.url);

function javascriptFiles() {
    const names = readdirSync(root, {recursive: true, encoding: 'utf8'});
    return names.filter(
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
        for (const [index, line] of lines.entries()) {
            if (/\\n\s+\/\//.test(line)) broken.push(`${name}:${index + 1}`);
        }
    }

    assert.deepEqual(
        broken,
        [],
        `literal \\n inside comments: ${broken.join(', ')}`,
    );
});
