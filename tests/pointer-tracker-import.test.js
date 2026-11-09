import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('dock uses Meta.CursorTracker instead of the removed pointerWatcher module', async () => {
    const source = await readFile(new URL('../lib/dock.js', import.meta.url), 'utf8');

    assert.doesNotMatch(source, /pointerWatcher\.js|PointerWatcher/);
    assert.match(
        source,
        /global\.backend\?\.get_cursor_tracker\?\.\(\)\s*\?\?\s*Meta\.CursorTracker\.get_for_display\(global\.display\)/,
    );
    assert.match(source, /connect\('position-invalidated'/);
    assert.match(source, /global\.get_pointer\(\)/);
    assert.match(source, /_stopPointerTracking\(\)/);
    assert.match(source, /_pointerTracker\.disconnect\(this\._pointerSignalId\)/);
});
