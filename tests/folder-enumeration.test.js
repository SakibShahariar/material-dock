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

    assert.deepEqual(
        collectFolderBatch(target, batch, 10, entry => !entry.directory && !entry.hidden),
        {scanned: 4, truncated: false},
    );
    assert.deepEqual(target.map(entry => entry.name), ['notes.txt', 'photo.png']);
});

test('stops at the raw entry limit and never appends beyond it', () => {
    const target = [];
    const batch = Array.from({length: 8}, (_, index) => ({name: String(index)}));

    assert.deepEqual(collectFolderBatch(target, batch, 5, () => true), {
        scanned: 5,
        truncated: true,
    });
    assert.deepEqual(target.map(entry => entry.name), ['0', '1', '2', '3', '4']);
});

test('does not mark an exactly full final batch as truncated', () => {
    const target = [];
    const batch = [{name: 'a'}, {name: 'b'}, {name: 'c'}];

    assert.deepEqual(collectFolderBatch(target, batch, 3, () => true), {
        scanned: 3,
        truncated: false,
    });
    assert.equal(target.length, 3);
});

test('detects additional entries in the next batch after the limit is reached', () => {
    const target = [{name: 'a'}, {name: 'b'}];

    assert.deepEqual(collectFolderBatch(target, [{name: 'c'}], 0, () => true), {
        scanned: 0,
        truncated: true,
    });
    assert.deepEqual(target.map(entry => entry.name), ['a', 'b']);
});

test('can finish a scan with no eligible files without reporting truncation', () => {
    const target = [];

    assert.deepEqual(
        collectFolderBatch(
            target,
            [{directory: true}, {hidden: true}],
            10,
            entry => !entry.directory && !entry.hidden,
        ),
        {scanned: 2, truncated: false},
    );
    assert.deepEqual(target, []);
});
