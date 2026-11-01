const VALUE_LABELS = [
    ['extensionVersion', 'Extension version'],
    ['shellVersion', 'GNOME Shell version'],
    ['sessionType', 'Session type'],
    ['monitorIndex', 'Dock monitor index'],
    ['monitorCount', 'Connected monitors'],
    ['monitorSize', 'Dock monitor size'],
    ['primaryMonitor', 'Dock on primary monitor'],
    ['dockPosition', 'Dock position'],
    ['autohideMode', 'Autohide mode'],
    ['configuredIconSize', 'Configured icon size'],
    ['fittedIconSize', 'Current icon size'],
    ['autoFitEnabled', 'Auto-fit enabled'],
    ['dockAppCount', 'Dock app icons'],
    ['windowCount', 'Open window count'],
    ['activePopover', 'Popover open'],
];

/**
 * Build a shareable report from an explicit allowlist of non-identifying
 * runtime values. Never serialize settings wholesale or include app/file names.
 */
export function buildDiagnosticsReport(values) {
    return [
        'Material Dock diagnostics',
        ...VALUE_LABELS.map(([key, label]) => {
            const value = values[key];
            return `${label}: ${value === undefined || value === null || value === '' ? 'unknown' : value}`;
        }),
    ].join('\n');
}
