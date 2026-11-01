import test from 'node:test';
import assert from 'node:assert/strict';

import {hasDockContent} from '../lib/empty-state.js';

test('empty state is shown when every dock section has no eligible content', () => {
    assert.equal(hasDockContent(), false);
    assert.equal(hasDockContent({appCount: 0, showApps: false, showDesktop: false}), false);
});

test('any visible app, control, minimized tile, or stack prevents the empty state', () => {
    for (const options of [
        {appCount: 1},
        {showApps: true},
        {showDesktop: true},
        {minimizedCount: 1},
        {stackCount: 1},
    ]) {
        assert.equal(hasDockContent(options), true, JSON.stringify(options));
    }
});

test('zero and invalid section counts do not make the dock appear populated', () => {
    assert.equal(
        hasDockContent({appCount: 0, minimizedCount: -1, stackCount: 'invalid'}),
        false,
    );
});
