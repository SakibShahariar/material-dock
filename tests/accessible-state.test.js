import test from 'node:test';
import assert from 'node:assert/strict';

import {getAccessibleAppDescription} from '../lib/accessible-state.js';

test('describes running, focused, and urgent app state with window count', () => {
    assert.equal(
        getAccessibleAppDescription(true, true, true, 3),
        'Running; Focused; Requires attention; 3 windows open',
    );
});

test('describes stopped apps and handles a single window', () => {
    assert.equal(getAccessibleAppDescription(false, false, false, 1), 'Not running; 1 window open');
});

test('omits window counts when none are open and clamps invalid counts', () => {
    assert.equal(getAccessibleAppDescription(false, false, false, 0), 'Not running');
    assert.equal(getAccessibleAppDescription(true, false, false, Number.NaN), 'Running');
    assert.equal(getAccessibleAppDescription(true, false, false, -4), 'Running');
});
