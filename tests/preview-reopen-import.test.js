import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('PreviewPopup imports the reopen guard it constructs', async () => {
    const source = await readFile(new URL('../lib/previews.js', import.meta.url), 'utf8');

    assert.match(
        source,
        /import\s*\{\s*PreviewReopenGuard\s*\}\s*from\s*['"]\.\/preview-reopen-guard\.js['"]/,
    );
    assert.match(source, /new\s+PreviewReopenGuard\s*\(/);
});
