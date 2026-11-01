import test from 'node:test';
import assert from 'node:assert/strict';

import {buildDiagnosticsReport} from '../lib/diagnostics.js';

test('formats the documented diagnostic fields in a stable order', () => {
    const report = buildDiagnosticsReport({
        extensionVersion: 1,
        shellVersion: '50.1',
        sessionType: 'wayland',
        monitorIndex: 1,
        monitorCount: 2,
        monitorSize: '2560x1440',
        primaryMonitor: false,
        dockPosition: 'bottom',
        autohideMode: 'intelligent',
        configuredIconSize: 48,
        fittedIconSize: 36,
        autoFitEnabled: true,
        dockAppCount: 7,
        windowCount: 9,
        activePopover: false,
    });

    assert.match(report, /^Material Dock diagnostics/);
    const shellVersionIndex = report.indexOf('GNOME Shell version: 50.1');
    const sessionTypeIndex = report.indexOf('Session type: wayland');
    assert.ok(shellVersionIndex < sessionTypeIndex);
    assert.match(report, /Current icon size: 36/);
    assert.match(report, /Popover open: false/);
});

test('uses unknown for unavailable values and excludes unapproved private fields', () => {
    const report = buildDiagnosticsReport({
        sessionType: null,
        folderStacks: ['/home/user/Private'],
        appNames: ['Personal App'],
        settings: {secret: 'value'},
    });

    assert.match(report, /Session type: unknown/);
    assert.doesNotMatch(report, /Private|Personal App|secret|folderStacks|appNames/);
});
