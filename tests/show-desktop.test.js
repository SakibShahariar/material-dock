import test from 'node:test';
import assert from 'node:assert/strict';

import {getWindowsToMinimize} from '../lib/show-desktop.js';

function windowState({monitor = 0, minimized = false, skipTaskbar = false, mapped = true} = {}) {
    return {
        minimized,
        skip_taskbar: skipTaskbar,
        get_monitor: () => monitor,
        get_compositor_private: () => mapped ? {} : null,
    };
}

test('selects only eligible windows on the primary monitor', () => {
    const primary = windowState();
    const secondary = windowState({monitor: 1});
    const minimized = windowState({minimized: true});
    const skipTaskbar = windowState({skipTaskbar: true});
    const unmapped = windowState({mapped: false});

    assert.deepEqual(
        getWindowsToMinimize([primary, secondary, minimized, skipTaskbar, unmapped], 0),
        [primary]);
});

test('handles empty and invalid window lists', () => {
    assert.deepEqual(getWindowsToMinimize([], 0), []);
    assert.deepEqual(getWindowsToMinimize([null, undefined], 0), []);
});
