import test from 'node:test';
import assert from 'node:assert/strict';

import {
    calculateAvailableDockWidth,
    calculateAutoFitIconSize,
    calculateDockItemSpacing,
    calculateMagnificationReserve,
    calculateMinimizedIconSize,
} from '../lib/layout.js';

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

test('falls back to valid icon sizes for non-finite measurements', () => {
    assert.equal(calculateAutoFitIconSize(Number.NaN, 100, 200), 16);
    assert.equal(calculateAutoFitIconSize(48, Number.NaN, 200), 16);
    assert.equal(calculateAutoFitIconSize(48, 100, Number.NaN), 48);
    assert.equal(calculateAutoFitIconSize(200, 100, 400), 32);
});

test('preserves small configured icons when no shrink is needed', () => {
    assert.equal(calculateAutoFitIconSize(16, 160, 160), 16);
    assert.equal(calculateAutoFitIconSize(20, 200, 200), 20);
});

test('reserves half the magnified icon overhang at each horizontal edge', () => {
    assert.equal(calculateMagnificationReserve(48, 1.25), 6);
    assert.equal(calculateMagnificationReserve(48, 2), 24);
});

test('does not reserve space when magnification is disabled or scale is invalid', () => {
    assert.equal(calculateMagnificationReserve(48, 1), 0);
    assert.equal(calculateMagnificationReserve(48, Number.NaN), 0);
    assert.equal(calculateMagnificationReserve(Number.NaN, 2), 0);
});

test('bounds magnification reserve to the supported scale range', () => {
    assert.equal(calculateMagnificationReserve(48, 0.5), 0);
    assert.equal(calculateMagnificationReserve(48, 10), 48);
});

test('scales app spacing with the fitted icon size', () => {
    assert.equal(calculateDockItemSpacing(48), 12);
    assert.equal(calculateDockItemSpacing(32), 8);
    assert.equal(calculateDockItemSpacing(16), 8);
    assert.equal(calculateDockItemSpacing(Number.NaN), 8);
});

test('keeps minimized window icons visible at the smallest fitted size', () => {
    assert.equal(calculateMinimizedIconSize(48), 34);
    assert.equal(calculateMinimizedIconSize(32), 18);
    assert.equal(calculateMinimizedIconSize(16), 16);
    assert.equal(calculateMinimizedIconSize(Number.NaN), 16);
});
