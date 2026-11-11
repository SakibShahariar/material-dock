const REQUIRED_MATUGEN_COLORS = [
    'surface_container',
    'surface_container_high',
    'on_surface',
    'on_surface_variant',
    'primary',
    'error',
    'scrim',
];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function parseMatugenColors(text) {
    const vars = {};
    const re = /--([a-z0-9_]+)\s*:\s*(#[0-9a-fA-F]{6})/g;
    let match;
    while ((match = re.exec(text)) !== null) vars[match[1]] = match[2];
    return vars;
}

export function hasRequiredMatugenColors(vars) {
    return REQUIRED_MATUGEN_COLORS.every(name => HEX_COLOR.test(vars[name] ?? ''));
}

function color(vars, name, fallback) {
    const value = vars[name];
    return HEX_COLOR.test(value ?? '') ? value : fallback;
}

function rgba(hex, alpha) {
    const value = hex.slice(1);
    const red = Number.parseInt(value.slice(0, 2), 16);
    const green = Number.parseInt(value.slice(2, 4), 16);
    const blue = Number.parseInt(value.slice(4, 6), 16);
    return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alpha + ')';
}

// prettier-ignore
export function generateMatugenStylesheet(vars) {
    if (!hasRequiredMatugenColors(vars))
        throw new TypeError('Incomplete Matugen palette');
    const surface = color(vars, 'surface', vars.surface_container);
    const surfaceLow = color(vars, 'surface_container_low', vars.surface_container);
    const surfaceHigh = vars.surface_container_high;
    const surfaceHighest = color(vars, 'surface_container_highest', surfaceHigh);
    const onSurface = vars.on_surface;
    const onSurfaceVariant = vars.on_surface_variant;
    const primary = vars.primary;
    const error = vars.error;
    const onError = color(vars, 'on_error', onSurface);
    const secondaryContainer = color(vars, 'secondary_container', surfaceHigh);
    const onSecondaryContainer = color(vars, 'on_secondary_container', onSurface);
    const outline = color(vars, 'outline', onSurfaceVariant);
    const outlineVariant = color(vars, 'outline_variant', onSurfaceVariant);
    const scrim = vars.scrim;

    const lines = [
        '/* Generated from the Matugen Material 3 palette. */',
        '.material-dock-card { color: ' + onSurface + '; background-color: ' + rgba(surfaceLow, 0.94) + '; border: 1px solid ' + rgba(outlineVariant, 0.72) + '; box-shadow: 0 10px 28px ' + rgba(scrim, 0.28) + '; }',
        '.material-dock-indicator-dot, .material-dock-indicator-bar { background-color: ' + rgba(onSurfaceVariant, 0.48) + '; }',
        '.material-dock-indicator-dot.running, .material-dock-indicator-bar.running { background-color: ' + rgba(onSurfaceVariant, 0.88) + '; }',
        '.material-dock-indicator-dot.active-bar, .material-dock-indicator-dot.focused, .material-dock-indicator-bar.active, .material-dock-indicator-bar.focused { background-color: ' + primary + '; }',
        '.material-dock-indicator-dot.active-bar, .material-dock-indicator-dot.focused { border-color: ' + rgba(outline, 0.7) + '; }',
        '.material-dock-indicator-dot.urgent, .material-dock-indicator-bar.urgent { background-color: ' + error + '; }',
        '.material-dock-indicator-dot.urgent { box-shadow: 0 0 6px ' + rgba(error, 0.48) + '; }',
        '.material-dock-indicator-count { color: ' + onSecondaryContainer + '; background-color: ' + secondaryContainer + '; }',
        '.material-dock-tile:hover, .material-dock-min-tile:hover, .material-dock-preview-button:hover, .material-dock-show-desktop:hover { background-color: ' + rgba(onSurface, 0.10) + '; }',
        '.material-dock-tile:active, .material-dock-min-tile:active, .material-dock-preview-button:active, .material-dock-show-desktop:active { background-color: ' + rgba(onSurface, 0.16) + '; }',
        '.material-dock-tile-label, .material-dock-min-tile-label, .material-dock-preview-title { color: ' + onSurface + '; }',
        '.material-dock-min-tile { background-color: ' + rgba(surfaceHighest, 0.72) + '; }',
        '.material-dock-min-tile-close:hover, .material-dock-preview-close:hover { color: ' + onError + '; background-color: ' + error + '; }',
        '.material-dock-preview-panel { color: ' + onSurface + '; background-color: ' + rgba(surfaceHigh, 0.98) + '; border: 1px solid ' + rgba(outlineVariant, 0.8) + '; box-shadow: 0 8px 24px ' + rgba(scrim, 0.3) + '; }',
        '.material-dock-preview-empty, .material-dock-preview-more, .material-dock-file-sub, .material-dock-empty-state { color: ' + onSurfaceVariant + '; }',
        '.material-dock-preview-close { color: ' + onSurfaceVariant + '; }',
        '.material-dock-folder-count { color: ' + onSurfaceVariant + '; background-color: ' + rgba(surface, 0.88) + '; }',
        '.material-dock-section-separator { background-color: ' + outlineVariant + '; }',
    ];
    return lines.join('\n') + '\n';
}