import test from 'node:test';
import assert from 'node:assert/strict';

import {runGroupAction} from '../lib/group-actions.js';

test('runs every group action even when one member fails', () => {
    const attempted = [];
    const result = runGroupAction(['first', 'broken', 'last'], item => {
        attempted.push(item);
        if (item === 'broken') throw new Error('failed');
    });

    assert.deepEqual(attempted, ['first', 'broken', 'last']);
    assert.deepEqual(result, {completed: 2, failed: 1});
});

test('reports an empty group without attempting actions', () => {
    let called = false;
    const result = runGroupAction([], () => {
        called = true;
    });

    assert.equal(called, false);
    assert.deepEqual(result, {completed: 0, failed: 0});
});
