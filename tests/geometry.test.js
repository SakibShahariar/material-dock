import test from 'node:test';
import assert from 'node:assert/strict';

import {rectsOverlap} from '../lib/geometry.js';

test('detects intersecting rectangles', () => {
    assert.equal(rectsOverlap(
        {x1: 0, y1: 0, x2: 100, y2: 100},
        {x1: 80, y1: 50, x2: 120, y2: 150}), true);
});

test('does not count touching edges as overlap', () => {
    assert.equal(rectsOverlap(
        {x1: 0, y1: 0, x2: 100, y2: 100},
        {x1: 100, y1: 20, x2: 150, y2: 80}), false);
    assert.equal(rectsOverlap(
        {x1: 0, y1: 0, x2: 100, y2: 100},
        {x1: 20, y1: 100, x2: 80, y2: 150}), false);
});

test('detects containment and negative-coordinate monitor geometry', () => {
    assert.equal(rectsOverlap(
        {x1: -1920, y1: 0, x2: 0, y2: 1080},
        {x1: -500, y1: 400, x2: -100, y2: 800}), true);
    assert.equal(rectsOverlap(
        {x1: 0, y1: 0, x2: 100, y2: 100},
        {x1: 10, y1: 10, x2: 90, y2: 90}), true);
});
