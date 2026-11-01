import test from 'node:test';
import assert from 'node:assert/strict';

import {collectFolderBatch} from '../lib/folder-enumeration.js';

test('collects only eligible entries while counting every scanned entry', () => {
    const target = [];
    const batch = [
        {name: 'folder', directory: true},
        {name: '.hidden', hidden: true},
        {name: 'notes.txt'},
        {name: 'photo.png'},
    ];

    const result = collectFolderBatch(
        target,
        batch,
        10,
        entry => !entry.directory && !entry.hidden,
    );

    assert.equal(result.scanned, 4);
    assert.equal(result.truncated, false);
    assert.deepEqual(target.map(entry => entry.name), ['notes.txt', 'photo.png']);
});

test('stops at the raw entry limit and never appends beyond it', () => {
    const target = [];
    const batch = Array.from({length: 8}, (_, index) => ({name: String(index)}));

    const result = collectFolderBatch(target, batch, 5, () => true);

    assert.equal(result.scanned, 5);
    assert.equal(result.truncated, true);
    assert.deepEqual(target.map(entry => entry.name), ['0', '1', '2', '3', '4']);
});

test('does not mark an exactly full final batch as truncated', () => {
    const target = [];
    const batch = [{name: 'a'}, {name: 'b'}, {name: 'c'}];

    const result = collectFolderBatch(target, batch, 3, () => true);

    assert.equal(result.scanned, 3);
    assert.equal(result.truncated, false);
    assert.equal(target.length, 3);
});

test('detects additional entries in the next batch after the limit is reached', () => {
    const target = [{name: 'a'}, {name: 'b'}];

    const result = collectFolderBatch(target, [{name: 'c'}], 0, () => true);

    assert.equal(result.scanned, 0);
    assert.equal(result.truncated, true);
    assert.deepEqual(target.map(entry => entry.name), ['a', 'b']);
});

test('can finish a scan with no eligible files without reporting truncation', () => {
    const target = [];

    const result = collectFolderBatch(
        target,
        [{directory: true}, {hidden: true}],
        10,
        entry => !entry.directory && !entry.hidden,
    );

    assert.equal(result.scanned, 2);
    assert.equal(result.truncated, false);
    assert.deepEqual(target, []);
});
