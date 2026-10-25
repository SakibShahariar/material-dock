import test from 'node:test';
import assert from 'node:assert/strict';

import {calculateAutoFitIconSize} from '../lib/layout.js';

test('keeps configured size when the dock already fits', () => {
    assert.equal(calculateAutoFitIconSize(48, 240, 220), 48);
});

test('keeps configured size when the measured width is unavailable', () => {
    assert.equal(calculateAutoFitIconSize(48, 240, 0), 48);
});

test('scales proportionally and rounds down to a multiple of four', () => {
    assert.equal(calculateAutoFitIconSize(48, 200, 240), 40);
});

test('never shrinks below the 24px auto-fit floor for regular icons', () => {
    assert.equal(calculateAutoFitIconSize(48, 100, 480), 24);
});

test('does not grow beyond the configured size', () => {
    assert.equal(calculateAutoFitIconSize(48, 100, 480), 24);
    assert.equal(calculateAutoFitIconSize(32, 100, 400), 24);
});

test('small configured icons shrink only as far as the schema minimum', () => {
    assert.equal(calculateAutoFitIconSize(16, 10, 160), 16);
    assert.equal(calculateAutoFitIconSize(20, 10, 200), 16);
});

test('preserves small configured icons when no shrink is needed', () => {
    assert.equal(calculateAutoFitIconSize(16, 160, 160), 16);
    assert.equal(calculateAutoFitIconSize(20, 200, 200), 20);
});
