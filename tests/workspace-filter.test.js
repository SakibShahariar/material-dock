import test from 'node:test';
import assert from 'node:assert/strict';

import {filterAppsToWorkspace} from '../lib/workspace-filter.js';

const app = (...windows) => ({get_windows: () => windows});

test('keeps apps with a taskbar-visible window on the active workspace', () => {
    const active = {};
    const other = {};
    const currentApp = app({workspace: active, skip_taskbar: false});
    const otherApp = app({workspace: other, skip_taskbar: false});
    const mixedApp = app(
        {workspace: other, skip_taskbar: false},
        {workspace: active, skip_taskbar: false},
    );

    assert.deepEqual(filterAppsToWorkspace([currentApp, otherApp, mixedApp], active), [
        currentApp,
        mixedApp,
    ]);
});

test('ignores windows marked skip-taskbar and apps with no windows', () => {
    const active = {};
    const hiddenApp = app({workspace: active, skip_taskbar: true});
    const emptyApp = app();

    assert.deepEqual(filterAppsToWorkspace([hiddenApp, emptyApp], active), []);
});

test('returns an empty list when no apps have windows on the active workspace', () => {
    const active = {};
    const other = {};
    assert.deepEqual(
        filterAppsToWorkspace([app({workspace: other, skip_taskbar: false})], active),
        [],
    );
});
