import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

const baseStylesheet = read('stylesheet.css');
const darkStylesheet = read('stylesheet-dark.css');
const lightStylesheet = read('stylesheet-light.css');

const stylesheets = {
    'stylesheet.css': baseStylesheet,
    'stylesheet-dark.css': darkStylesheet,
    'stylesheet-light.css': lightStylesheet,
};

// Selectors whose colors differ between the dark base palette and the light
// palette. Every one must be overridden in stylesheet-light.css.
const paletteSelectors = [
    '.material-dock-card',
    '.material-dock-indicator-dot',
    '.material-dock-indicator-dot.running',
    '.material-dock-indicator-bar',
    '.material-dock-indicator-bar.running',
    '.material-dock-indicator-count',
    '.material-dock-tile:hover',
    '.material-dock-tile:active',
    '.material-dock-tile-label',
    '.material-dock-min-tile',
    '.material-dock-min-tile:hover',
    '.material-dock-min-tile-label',
    '.material-dock-preview-panel',
    '.material-dock-preview-button:hover',
    '.material-dock-preview-button:active',
    '.material-dock-preview-title',
    '.material-dock-preview-empty',
    '.material-dock-preview-more',
    '.material-dock-file-sub',
    '.material-dock-show-desktop:hover',
    '.material-dock-show-desktop:active',
    '.material-dock-empty-state',
    '.material-dock-folder-count',
    '.material-dock-section-separator',
];

test('stylesheets avoid color syntax that the GNOME Shell CSS parser rejects', () => {
    for (const [name, css] of Object.entries(stylesheets)) {
        assert.doesNotMatch(css, /\balpha\s*\(/, `${name} must not use alpha()`);
        assert.doesNotMatch(
            css,
            /@(theme|selected|error|warning|success)_[a-z_]+/,
            `${name} must not use GTK theme color tokens`,
        );
    }
});

test('variant stylesheets import the shared base stylesheet', () => {
    for (const [name, css] of [
        ['stylesheet-dark.css', darkStylesheet],
        ['stylesheet-light.css', lightStylesheet],
    ]) {
        assert.match(css, /@import url\("stylesheet\.css"\);/, `${name} must import the base`);
    }
});

test('the base stylesheet themes the dock with valid Shell colors', () => {
    assert.match(baseStylesheet, /\.material-dock-card\s*{[^}]*background-color:\s*rgba\(/s);
    assert.match(baseStylesheet, /-st-accent-color/);
    assert.doesNotMatch(baseStylesheet, /@selected_bg_color/);
});

test('the light variant overrides every palette-dependent selector', () => {
    for (const selector of paletteSelectors) {
        assert.ok(lightStylesheet.includes(selector), `missing light override: ${selector}`);
    }
});
