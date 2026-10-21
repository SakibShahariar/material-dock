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
