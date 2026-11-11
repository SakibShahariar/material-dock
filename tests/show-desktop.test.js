import test from 'node:test';
import assert from 'node:assert/strict';

import {getWindowsToMinimize, getWindowsToRestore} from '../lib/show-desktop.js';

function windowState({monitor = 0, minimized = false, skipTaskbar = false, mapped = true} = {}) {
    return {
        minimized,
        skip_taskbar: skipTaskbar,
        get_monitor: () => monitor,
        get_compositor_private: () => (mapped ? {} : null),
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
        [primary],
    );
});

test('handles empty and invalid window lists', () => {
    assert.deepEqual(getWindowsToMinimize([], 0), []);
    assert.deepEqual(getWindowsToMinimize([null, undefined], 0), []);
});

test('restores only still-live windows that remain minimized', () => {
    const minimized = windowState({minimized: true});
    const alreadyRestored = windowState();
    const closed = windowState({minimized: true, mapped: false});

    assert.deepEqual(getWindowsToRestore([minimized, alreadyRestored, closed]), [minimized]);
});

test('ignores windows that are being unmanaged while checking eligibility', () => {
    const destroyed = {
        minimized: false,
        skip_taskbar: false,
        get_monitor() {
            throw new Error('window unmanaged');
        },
        get_compositor_private() {
            throw new Error('window unmanaged');
        },
    };
    const noActor = windowState({mapped: false});
    const minimizedNoActor = windowState({minimized: true, mapped: false});
    assert.deepEqual(getWindowsToMinimize([destroyed, noActor], 0), []);
    assert.deepEqual(getWindowsToRestore([destroyed, minimizedNoActor]), []);
});

test('keeps processing eligible windows when another window is being destroyed', () => {
    const destroyed = {
        minimized: false,
        skip_taskbar: false,
        get_monitor() {
            throw new Error('window unmanaged');
        },
        get_compositor_private: () => null,
    };
    const healthy = windowState();
    assert.deepEqual(getWindowsToMinimize([destroyed, healthy], 0), [healthy]);
});
