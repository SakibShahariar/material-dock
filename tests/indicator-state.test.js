import test from 'node:test';
import assert from 'node:assert/strict';

import {getIndicatorStyle} from '../lib/indicator-state.js';

test('uses the base style when an app is not running or focused', () => {
    assert.equal(getIndicatorStyle(false, false, false, 0), 'material-dock-indicator-dot');
});

test('marks running indicators and distinguishes the focused marker', () => {
    assert.equal(getIndicatorStyle(true, false, false, 0), 'material-dock-indicator-dot running');
    assert.equal(getIndicatorStyle(true, true, false, 0), 'material-dock-indicator-dot focused');
    assert.equal(getIndicatorStyle(true, true, false, 1), 'material-dock-indicator-dot running');
});

test('urgent state takes precedence over focused and running states', () => {
    assert.equal(getIndicatorStyle(true, true, true, 0), 'material-dock-indicator-dot urgent');
});

test('uses bar classes when bar indicators are configured', () => {
    assert.equal(
        getIndicatorStyle(true, false, false, 0, 'bars'),
        'material-dock-indicator-bar running',
    );
    assert.equal(getIndicatorStyle(false, false, false, 0, 'bars'), 'material-dock-indicator-bar');
    assert.equal(
        getIndicatorStyle(false, true, false, 0, 'bars'),
        'material-dock-indicator-bar focused',
    );
});
