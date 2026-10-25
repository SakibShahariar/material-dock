import test from 'node:test';
import assert from 'node:assert/strict';

import {hasRequiredMatugenColors, parseMatugenColors} from '../lib/matugen-colors.js';

const completePalette = `
--surface_container: #1b2122;
--surface_container_high: #252b2c;
--on_surface: #e3e3e3;
--on_surface_variant: #c4c7c5;
--primary: #a8c7fa;
--error: #f2b8b5;
--scrim: #000000;
`;

test('parses Matugen hex colors and accepts a complete required palette', () => {
    const colors = parseMatugenColors(completePalette);
    assert.equal(colors.surface_container, '#1b2122');
    assert.equal(colors.primary, '#a8c7fa');
    assert.equal(hasRequiredMatugenColors(colors), true);
});

test('rejects an incomplete Matugen palette so GNOME theme colors can take over', () => {
    const colors = parseMatugenColors(completePalette.replace('--error: #f2b8b5;', ''));
    assert.equal(hasRequiredMatugenColors(colors), false);
});

test('rejects non-hex values for required palette colors', () => {
    const colors = parseMatugenColors(completePalette.replace('--primary: #a8c7fa;', '--primary: currentColor;'));
    assert.equal(hasRequiredMatugenColors(colors), false);
});

test('ignores unrelated variables without rejecting a complete palette', () => {
    const colors = parseMatugenColors(`${completePalette}--extra_color: #123456;`);
    assert.equal(hasRequiredMatugenColors(colors), true);
});
