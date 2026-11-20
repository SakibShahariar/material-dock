// SPDX-License-Identifier: GPL-2.0-or-later

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../prefs.js', import.meta.url), 'utf8');

test('combo subtitles stay short so selected values are not clipped', () => {
    for (const subtitle of [
        'Click behavior',
        'Middle-click behavior',
        'Scroll behavior',
        'Hide only when a window overlaps',
        'Icon size in pixels',
        'Marker style',
        'Zoom or wave effect',
        'Top or bottom edge',
        'Position along the edge',
        'Order inside folder stacks',
        'Display hosting the dock',
    ])
        assert.ok(source.includes(`'${subtitle}'`), `${subtitle} must be used`);

    for (const old of [
        'What happens when clicking a running app icon',
        'Choose whether middle-click opens a new window or activates the app',
        'Zoom grows the icon in place, wave also grows its neighbors',
        'Choose which display hosts the dock',
    ])
        assert.ok(!source.includes(old), `${old} must be removed`);
});
