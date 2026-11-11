import test from 'node:test';
import assert from 'node:assert/strict';

import {getVisibilityTransition} from '../lib/visibility.js';

test('does not restart an already visible dock', () => {
    assert.equal(getVisibilityTransition('visible', true), null);
});

test('does not restart an in-progress show animation', () => {
    assert.equal(getVisibilityTransition('showing', true), null);
});

test('does not restart an already hidden dock', () => {
    assert.equal(getVisibilityTransition('hidden', false), null);
});

test('does not restart an in-progress hide animation', () => {
    assert.equal(getVisibilityTransition('hiding', false), null);
});

test('reverses an in-progress hide when the dock must be shown', () => {
    assert.deepEqual(getVisibilityTransition('hiding', true), {
        stableState: 'visible',
        transitionState: 'showing',
    });
});

test('reverses an in-progress show when the dock must be hidden', () => {
    assert.deepEqual(getVisibilityTransition('showing', false), {
        stableState: 'hidden',
        transitionState: 'hiding',
    });
});

test('starts hiding from a visible state', () => {
    assert.deepEqual(getVisibilityTransition('visible', false), {
        stableState: 'hidden',
        transitionState: 'hiding',
    });
});

test('starts showing from a hidden state', () => {
    assert.deepEqual(getVisibilityTransition('hidden', true), {
        stableState: 'visible',
        transitionState: 'showing',
    });
});
