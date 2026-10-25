import test from 'node:test';
import assert from 'node:assert/strict';

import {shouldHideForShellState} from '../lib/shell-visibility.js';

test('does not suppress the dock by default in Overview or fullscreen', () => {
    assert.equal(shouldHideForShellState(true, true, false, false), false);
});

test('hides in Overview only when that preference is enabled', () => {
    assert.equal(shouldHideForShellState(true, false, true, false), true);
    assert.equal(shouldHideForShellState(true, false, false, false), false);
});

test('hides in fullscreen only when that preference is enabled', () => {
    assert.equal(shouldHideForShellState(false, true, false, true), true);
    assert.equal(shouldHideForShellState(false, true, false, false), false);
});

test('either enabled preference can request hiding', () => {
    assert.equal(shouldHideForShellState(true, false, true, true), true);
    assert.equal(shouldHideForShellState(false, true, true, true), true);
});
