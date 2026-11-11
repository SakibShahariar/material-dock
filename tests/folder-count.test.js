import test from 'node:test';
import assert from 'node:assert/strict';

import {formatFolderCount} from '../lib/folder-count.js';

test('formats exact folder item counts', () => {
    assert.equal(formatFolderCount(0), '0');
    assert.equal(formatFolderCount(14), '14');
});

test('marks capped folder counts as partial', () => {
    assert.equal(formatFolderCount(500, true), '500+');
});

test('normalizes invalid and negative counts', () => {
    assert.equal(formatFolderCount(-3), '0');
    assert.equal(formatFolderCount(Number.NaN), '0');
});
