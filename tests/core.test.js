import test from 'node:test';
import assert from 'node:assert/strict';

import {calculateAutoFitIconSize} from '../lib/layout.js';
import {accumulateSmoothScroll} from '../lib/scroll.js';
import {getVisibilityTransition} from '../lib/visibility.js';

test('auto-fit keeps configured size when available width is sufficient', () => {
    assert.equal(calculateAutoFitIconSize(64, 500, 400), 64);
});

test('auto-fit shrinks from the configured baseline and rounds down to a multiple of four', () => {
    assert.equal(calculateAutoFitIconSize(64, 250, 400), 40);
    assert.equal(calculateAutoFitIconSize(64, 200, 400), 32);
});

test('auto-fit enforces the minimum size when space is very limited', () => {
    assert.equal(calculateAutoFitIconSize(64, 20, 400), 24);
});

test('auto-fit handles an invalid measured width without shrinking', () => {
    assert.equal(calculateAutoFitIconSize(64, 10, 0), 64);
});

test('smooth scroll accumulates sub-step deltas without losing them', () => {
    assert.deepEqual(accumulateSmoothScroll(0, -0.4), {direction: 0, remainder: 0.4});
    assert.deepEqual(accumulateSmoothScroll(0.4, -0.6), {direction: 1, remainder: 0});
});

test('smooth scroll preserves extra steps and direction', () => {
    assert.deepEqual(accumulateSmoothScroll(0, -2.5), {direction: 1, remainder: 1.5});
    assert.deepEqual(accumulateSmoothScroll(0, 2), {direction: -1, remainder: -1});
});

test('smooth scroll drains deferred whole steps on later events', () => {
    const first = accumulateSmoothScroll(0, -2.5);
    assert.deepEqual(first, {direction: 1, remainder: 1.5});

    const second = accumulateSmoothScroll(first.remainder, 0);
    assert.deepEqual(second, {direction: 1, remainder: 0.5});

    const third = accumulateSmoothScroll(second.remainder, 0);
    assert.deepEqual(third, {direction: 0, remainder: 0.5});
});

test('smooth scroll allows accumulated deltas to reverse direction', () => {
    const partial = accumulateSmoothScroll(0.7, 1);
    assert.equal(partial.direction, 0);
    assert.ok(Math.abs(partial.remainder + 0.3) < 1e-9);
    const reversed = accumulateSmoothScroll(partial.remainder, 0.8);
    assert.equal(reversed.direction, -1);
    assert.ok(Math.abs(reversed.remainder + 0.1) < 1e-9);
});

test('visibility resolver starts only transitions that are not already stable or underway', () => {
    assert.deepEqual(getVisibilityTransition('hidden', true), {
        stableState: 'visible',
        transitionState: 'showing',
    });
    assert.equal(getVisibilityTransition('visible', true), null);
    assert.equal(getVisibilityTransition('showing', true), null);
    assert.deepEqual(getVisibilityTransition('showing', false), {
        stableState: 'hidden',
        transitionState: 'hiding',
    });
});

test('visibility resolver reverses an in-flight transition when the target changes', () => {
    assert.deepEqual(getVisibilityTransition('showing', false), {
        stableState: 'hidden',
        transitionState: 'hiding',
    });
    assert.deepEqual(getVisibilityTransition('hiding', true), {
        stableState: 'visible',
        transitionState: 'showing',
    });
});

test('visibility resolver recovers from an unrecognized state', () => {
    assert.deepEqual(getVisibilityTransition('unknown', true), {
        stableState: 'visible',
        transitionState: 'showing',
    });
    assert.deepEqual(getVisibilityTransition('unknown', false), {
        stableState: 'hidden',
        transitionState: 'hiding',
    });
});
