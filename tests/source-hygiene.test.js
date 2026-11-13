import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';

const root = new URL('..', import.meta.url);

test('source comments contain no literal \\n escapes that swallow code', () => {
    const broken = [];
    const names = readdirSync(root, {recursive: true, encoding: 'utf8'});

    for (const name of names) {
        if (!name.endsWith('.js')) continue;
        if (name.startsWith('.git/') || name.startsWith('node_modules/')) continue;

        const lines = readFileSync(new URL(name, root), 'utf8').split('\n');
        lines.forEach((line, index) => {
            if (/\\n\s+\/\//.test(line)) broken.push(name + ':' + (index + 1));
        });
    }

    assert.deepEqual(broken, []);
});
