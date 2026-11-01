import test from 'node:test';
import assert from 'node:assert/strict';

import {collectFolderBatch} from '../lib/folder-enumeration.js';

test('collects visible files and skips directories and hidden entries', () => {
    const target = [];
    const batch = [{name: 'folder', directory: true}, {name: '.hidden', hidden: true}, {name: 'file'}];
    const result = collectFolderBatch(target, batch, 10, entry => !entry.directory && !entry.hidden);

    assert.equal(result.scanned, 3);
    assert.equal(result.truncated, false);
    assert.deepEqual(target.map(entry => entry.name), ['file']);
});

test('stops at the raw entry limit without appending beyond it', () => {
    const target = [];
    const batch = [{id: 1}, {id: 2}, {id: 3}, {id: 4}];
    const result = collectFolderBatch(target, batch, 3, () => true);

    assert.equal(result.scanned, 3);
    assert.equal(result.truncated, true);
    assert.deepEqual(target.map(entry => entry.id), [1, 2, 3]);
});

test('does not mark an exactly full final batch as truncated', () => {
    const target = [];
    const batch = [{id: 1}, {id: 2}];
    const result = collectFolderBatch(target, batch, 2, () => true);

    assert.equal(result.scanned, 2);
    assert.equal(result.truncated, false);
    assert.equal(target.length, 2);
});

test('detects another batch after the scan limit is reached', () => {
    const target = [{id: 1}];
    const result = collectFolderBatch(target, [{id: 2}], 0, () => true);

    assert.equal(result.scanned, 0);
    assert.equal(result.truncated, true);
    assert.deepEqual(target.map(entry => entry.id), [1]);
});

test('completes folders with no eligible files without reporting truncation', () => {
    const target = [];
    const batch = [{directory: true}, {hidden: true}];
    const result = collectFolderBatch(target, batch, 10, entry => !entry.directory && !entry.hidden);

    assert.equal(result.scanned, 2);
    assert.equal(result.truncated, false);
    assert.deepEqual(target, []);
});
