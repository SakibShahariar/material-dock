import test from 'node:test';
import assert from 'node:assert/strict';

import {getSectionSeparatorVisibility} from '../lib/section-separators.js';

test('shows separators only after visible sections with later content', () => {
    assert.deepEqual(
        getSectionSeparatorVisibility([true, true, true, true]),
        [true, true, true, false],
    );
});

test('skips hidden sections without leaving duplicate separators', () => {
    assert.deepEqual(
        getSectionSeparatorVisibility([true, false, true, true]),
        [true, false, true, false],
    );
    assert.deepEqual(
        getSectionSeparatorVisibility([false, true, false, true]),
        [false, true, false, false],
    );
});

test('does not show separators when the option is disabled', () => {
    assert.deepEqual(
        getSectionSeparatorVisibility([true, true, true], false),
        [false, false, false],
    );
});

test('does not show a separator when only one section is visible', () => {
    assert.deepEqual(
        getSectionSeparatorVisibility([false, true, false, false]),
        [false, false, false, false],
    );
});
