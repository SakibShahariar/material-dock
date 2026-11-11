import test from 'node:test';
import assert from 'node:assert/strict';

import {buildMonitorOptions} from '../lib/monitor-options.js';

test('always offers the primary monitor and labels connected displays', () => {
    assert.deepEqual(buildMonitorOptions(2), [
        ['Primary monitor', -1],
        ['Monitor 1', 0],
        ['Monitor 2', 1],
    ]);
});

test('handles missing, negative, and fractional monitor counts safely', () => {
    assert.deepEqual(buildMonitorOptions(0), [['Primary monitor', -1]]);
    assert.deepEqual(buildMonitorOptions(-2), [['Primary monitor', -1]]);
    assert.deepEqual(buildMonitorOptions(2.8), [
        ['Primary monitor', -1],
        ['Monitor 1', 0],
        ['Monitor 2', 1],
    ]);
    assert.deepEqual(buildMonitorOptions(Number.NaN), [['Primary monitor', -1]]);
});
