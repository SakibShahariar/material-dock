import test from 'node:test';
import assert from 'node:assert/strict';

import {getNextWindowIndex} from '../lib/window-cycle.js';

test('starts forward cycling at the first window when nothing is focused yet', () => {
    assert.equal(getNextWindowIndex(3, -1, -1, 1), 0);
});

test('starts backward cycling at the last window when nothing is focused yet', () => {
    assert.equal(getNextWindowIndex(3, -1, -1, -1), 2);
});

test('prefers the focused window over a stale cycle index', () => {
    assert.equal(getNextWindowIndex(4, 2, 0, 1), 3);
});

test('wraps forward and backward at the list boundaries', () => {
    assert.equal(getNextWindowIndex(3, 2, 1, 1), 0);
    assert.equal(getNextWindowIndex(3, 0, 2, -1), 2);
});

test('clamps stale indexes and handles empty window lists', () => {
    assert.equal(getNextWindowIndex(3, -1, 20, 1), 0);
    assert.equal(getNextWindowIndex(0, -1, -1, 1), -1);
});

test('rejects an unsupported direction', () => {
    assert.equal(getNextWindowIndex(3, -1, -1, 0), -1);
});
