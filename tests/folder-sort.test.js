import test from 'node:test';
import assert from 'node:assert/strict';

import {sortFolderEntries} from '../lib/folder-sort.js';

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

    assert.deepEqual(entries.map(entry => entry.name), ['b', 'a']);
});

test('falls back to name order for unknown modes and keeps equal entries stable', () => {
    const entries = [{name: 'same', id: 1}, {name: 'same', id: 2}, {name: 'alpha', id: 3}];

    assert.deepEqual(sortFolderEntries(entries, 'unknown').map(entry => entry.id), [3, 1, 2]);
});
