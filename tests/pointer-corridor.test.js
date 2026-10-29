import test from 'node:test';
import assert from 'node:assert/strict';

import {buildHoverCorridor, pointInRect} from '../lib/pointer-corridor.js';

test('builds a padded corridor spanning the dock and preview panel', () => {
    assert.deepEqual(
        buildHoverCorridor(
            {x1: 100, y1: 200, x2: 220, y2: 280},
            {x1: 80, y1: 300, x2: 240, y2: 340},
            10,
        ),
        {x1: 70, y1: 190, x2: 250, y2: 350},
    );
});

test('corridor geometry handles a preview positioned left of the dock', () => {
    assert.deepEqual(
        buildHoverCorridor(
            {x1: 10, y1: 30, x2: 60, y2: 80},
            {x1: 40, y1: 100, x2: 120, y2: 130},
            5,
        ),
        {x1: 5, y1: 25, x2: 125, y2: 135},
    );
});

test('pointer inclusion includes rectangle edges and excludes points outside', () => {
    const rect = {x1: 10, y1: 20, x2: 30, y2: 40};
    assert.equal(pointInRect(10, 20, rect), true);
    assert.equal(pointInRect(30, 40, rect), true);
    assert.equal(pointInRect(9.99, 20, rect), false);
    assert.equal(pointInRect(30, 40.01, rect), false);
});
