import test from 'node:test';
import assert from 'node:assert/strict';

import {accumulateSmoothScroll} from '../lib/scroll.js';

test('waits for a full step when the touchpad delta is small', () => {
    assert.deepEqual(accumulateSmoothScroll(0, 0.25), {
        direction: 0,
        remainder: -0.25,
    });
});

test('accumulates several sub-step events until a step is reached', () => {
    const first = accumulateSmoothScroll(0, 0.4);
    const second = accumulateSmoothScroll(first.remainder, 0.7);
    assert.equal(first.direction, 0);
    assert.equal(second.direction, -1);
    assert.ok(Math.abs(second.remainder - 0.1) < 1e-9);
});

test('preserves the remainder after consuming one step', () => {
    assert.deepEqual(accumulateSmoothScroll(0, -1.4), {
        direction: 1,
        remainder: 0.3999999999999999,
    });
});

test('supports a reverse gesture after accumulated movement', () => {
    const first = accumulateSmoothScroll(0, 0.8);
    const second = accumulateSmoothScroll(first.remainder, -0.2);
    assert.equal(first.direction, 0);
    assert.equal(second.direction, 1);
});
