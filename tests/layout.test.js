import test from 'node:test';
import assert from 'node:assert/strict';

import {calculateAvailableDockWidth, calculateAutoFitIconSize} from '../lib/layout.js';

test('deducts only the dock edge margins from the monitor width', () => {
    assert.equal(calculateAvailableDockWidth(1920, 4), 1912);
    assert.equal(calculateAvailableDockWidth(320, 8), 304);
});

test('keeps available width positive for tiny monitors and extreme margins', () => {
    assert.equal(calculateAvailableDockWidth(80, 100), 1);
    assert.equal(calculateAvailableDockWidth(Number.NaN, 4), 1);
    assert.equal(calculateAvailableDockWidth(320, -5), 320);
});

test('keeps configured size when the dock already fits', () => {
    assert.equal(calculateAutoFitIconSize(48, 240, 220), 48);
});

test('keeps configured size when the measured width is unavailable', () => {
    assert.equal(calculateAutoFitIconSize(48, 240, 0), 48);
});

test('scales proportionally and rounds down to a multiple of four', () => {
    assert.equal(calculateAutoFitIconSize(48, 200, 240), 40);
});

test('shrinks crowded docks to the schema minimum when needed', () => {
    assert.equal(calculateAutoFitIconSize(48, 100, 480), 16);
    assert.equal(calculateAutoFitIconSize(32, 100, 400), 16);
});

test('does not grow beyond the configured size', () => {
    assert.equal(calculateAutoFitIconSize(48, 100, 480), 16);
});

test('small configured icons shrink only as far as the schema minimum', () => {
    assert.equal(calculateAutoFitIconSize(16, 1, 160), 16);
    assert.equal(calculateAutoFitIconSize(20, 1, 200), 16);
});

test('falls back to valid icon sizes for non-finite measurements', () => {\n    assert.equal(calculateAutoFitIconSize(Number.NaN, 100, 200), 16);\n    assert.equal(calculateAutoFitIconSize(48, Number.NaN, 200), 16);\n    assert.equal(calculateAutoFitIconSize(48, 100, Number.NaN), 48);\n    assert.equal(calculateAutoFitIconSize(200, 100, 400), 32);\n});\n\ntest('preserves small configured icons when no shrink is needed', () => {
    assert.equal(calculateAutoFitIconSize(16, 160, 160), 16);
    assert.equal(calculateAutoFitIconSize(20, 200, 200), 20);
});
