import test from 'node:test';
import assert from 'node:assert/strict';

import {sortFolderEntries} from '../lib/folder-sort.js';
import {collectFolderBatch} from '../lib/folder-enumeration.js';

test('sorts names naturally and without case sensitivity', () => {
    const entries = [{name: 'file10'}, {name: 'File2'}, {name: 'file1'}];

    assert.deepEqual(
        sortFolderEntries(entries, 'name').map(entry => entry.name),
        ['file1', 'File2', 'file10'],
    );
});

test('sorts by modification time newest first and uses names for ties', () => {
    const entries = [
        {name: 'zeta.txt', modified: 4},
        {name: 'older.txt', modified: 1},
        {name: 'alpha.txt', modified: 4},
    ];

    assert.deepEqual(
        sortFolderEntries(entries, 'modified').map(entry => entry.name),
        ['alpha.txt', 'zeta.txt', 'older.txt'],
    );
});

test('sorts by type and uses names within each type', () => {
    const entries = [
        {name: 'photo.png', type: 'Image'},
        {name: 'notes.txt', type: 'Document'},
        {name: 'archive.zip', type: 'Archive'},
        {name: 'agenda.txt', type: 'Document'},
    ];

    assert.deepEqual(
        sortFolderEntries(entries, 'type').map(entry => entry.name),
        ['archive.zip', 'agenda.txt', 'notes.txt', 'photo.png'],
    );
});

test('does not mutate the input list', () => {
    const entries = [{name: 'b'}, {name: 'a'}];

    sortFolderEntries(entries, 'name');

    assert.deepEqual(
        entries.map(entry => entry.name),
        ['b', 'a'],
    );
});

test('falls back to name order for unknown modes and keeps equal entries stable', () => {
    const entries = [
        {name: 'same', id: 1},
        {name: 'same', id: 2},
        {name: 'alpha', id: 3},
    ];

    assert.deepEqual(
        sortFolderEntries(entries, 'unknown').map(entry => entry.id),
        [3, 1, 2],
    );
});

test('collects eligible files and filters hidden entries and directories', () => {
    const target = [];
    const batch = [{directory: true}, {hidden: true}, {name: 'visible'}];
    const result = collectFolderBatch(
        target,
        batch,
        10,
        entry => !entry.directory && !entry.hidden,
    );

    assert.equal(result.scanned, 3);
    assert.equal(result.truncated, false);
    assert.deepEqual(target, [batch[2]]);
});

test('stops collecting when the remaining scan budget is exhausted', () => {
    const target = [];
    const batch = [{id: 1}, {id: 2}, {id: 3}, {id: 4}];
    const result = collectFolderBatch(target, batch, 3, () => true);

    assert.equal(result.scanned, 3);
    assert.equal(result.truncated, true);
    assert.deepEqual(target, batch.slice(0, 3));
});

test('keeps an exactly full final batch complete', () => {
    const target = [];
    const batch = [{id: 1}, {id: 2}];
    const result = collectFolderBatch(target, batch, 2, () => true);

    assert.equal(result.scanned, 2);
    assert.equal(result.truncated, false);
    assert.equal(target.length, 2);
});

test('detects more entries when the scan budget is already exhausted', () => {
    const target = [{id: 1}];
    const result = collectFolderBatch(target, [{id: 2}], 0, () => true);

    assert.equal(result.scanned, 0);
    assert.equal(result.truncated, true);
    assert.deepEqual(target, [{id: 1}]);
});

test('does not report truncation when a complete batch has no eligible files', () => {
    const target = [];
    const batch = [{directory: true}, {hidden: true}];
    const result = collectFolderBatch(
        target,
        batch,
        10,
        entry => !entry.directory && !entry.hidden,
    );

    assert.equal(result.scanned, 2);
    assert.equal(result.truncated, false);
    assert.deepEqual(target, []);
});
