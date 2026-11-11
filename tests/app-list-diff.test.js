import test from 'node:test';
import assert from 'node:assert/strict';

import {calculateAppListDiff} from '../lib/app-list-diff.js';

const app = id => ({id});

test('returns no changes when app order and object identities are unchanged', () => {
    const a = app('a');
    const b = app('b');

    assert.deepEqual(calculateAppListDiff([a, b], [a, b]), {
        addedItems: [],
        removedIndices: [],
    });
});

test('adds new apps at their requested positions', () => {
    const a = app('a');
    const b = app('b');
    const c = app('c');

    assert.deepEqual(calculateAppListDiff([a, c], [a, b, c]), {
        addedItems: [{app: b, pos: 1}],
        removedIndices: [],
    });
});

test('removes apps that are no longer present', () => {
    const a = app('a');
    const b = app('b');
    const c = app('c');

    assert.deepEqual(calculateAppListDiff([a, b, c], [a, c]), {
        addedItems: [],
        removedIndices: [1],
    });
});

test('handles replacing all apps without changing target order', () => {
    const oldA = app('old-a');
    const oldB = app('old-b');
    const newA = app('new-a');
    const newB = app('new-b');

    assert.deepEqual(calculateAppListDiff([oldA, oldB], [newA, newB]), {
        addedItems: [
            {app: newA, pos: 0},
            {app: newB, pos: 1},
        ],
        removedIndices: [0, 1],
    });
});

test('preserves existing app object identity when reordering', () => {
    const a = app('a');
    const b = app('b');

    assert.deepEqual(calculateAppListDiff([a, b], [b, a]), {
        addedItems: [{app: b, pos: 0}],
        removedIndices: [1],
    });
});

test('uses object identity rather than matching app identifiers', () => {
    const oldApp = app('same.desktop');
    const replacement = app('same.desktop');

    assert.deepEqual(calculateAppListDiff([oldApp], [replacement]), {
        addedItems: [{app: replacement, pos: 0}],
        removedIndices: [0],
    });
});

test('handles empty old and new lists', () => {
    const a = app('a');

    assert.deepEqual(calculateAppListDiff([], []), {
        addedItems: [],
        removedIndices: [],
    });
    assert.deepEqual(calculateAppListDiff([], [a]), {
        addedItems: [{app: a, pos: 0}],
        removedIndices: [],
    });
    assert.deepEqual(calculateAppListDiff([a], []), {
        addedItems: [],
        removedIndices: [0],
    });
});

test('handles insertions before and after retained apps', () => {
    const a = app('a');
    const b = app('b');
    const c = app('c');
    const d = app('d');

    assert.deepEqual(calculateAppListDiff([b, c], [a, b, c, d]), {
        addedItems: [
            {app: a, pos: 0},
            {app: d, pos: 3},
        ],
        removedIndices: [],
    });
});
