import test from 'node:test';
import assert from 'node:assert/strict';

import {
    moveAppGroup,
    normalizeAppGroup,
    replaceAppGroup,
} from '../lib/app-groups.js';

const available = ['org.gnome.Terminal.desktop', 'org.gnome.Nautilus.desktop'];

test('normalizes labels and app IDs and removes duplicate IDs', () => {
    assert.equal(
        normalizeAppGroup(
            '  Utilities  ',
            'org.gnome.Terminal.desktop, org.gnome.Terminal.desktop',
            available,
        ),
        'Utilities|org.gnome.Terminal.desktop',
    );
});

test('rejects empty labels, malformed IDs, and unavailable applications', () => {
    assert.equal(normalizeAppGroup('', ['org.gnome.Terminal.desktop'], available), null);
    assert.equal(
        normalizeAppGroup('Bad|Label', ['org.gnome.Terminal.desktop'], available),
        null,
    );
    assert.equal(normalizeAppGroup('Missing', ['missing.desktop'], available), null);
    assert.equal(normalizeAppGroup('Empty', [], available), null);
});

test('replaces an existing group without mutating the original list', () => {
    const groups = [
        'Tools|org.gnome.Terminal.desktop',
        'Files|org.gnome.Nautilus.desktop',
    ];
    const next = replaceAppGroup(groups, groups[0], 'Shell|org.gnome.Terminal.desktop');

    assert.deepEqual(next, ['Shell|org.gnome.Terminal.desktop', groups[1]]);
    assert.deepEqual(groups, [
        'Tools|org.gnome.Terminal.desktop',
        'Files|org.gnome.Nautilus.desktop',
    ]);
});

test('rejects replacing a missing or duplicate group', () => {
    const groups = ['Tools|org.gnome.Terminal.desktop', 'Files|org.gnome.Nautilus.desktop'];
    assert.equal(replaceAppGroup(groups, 'Missing|x', 'Shell|x'), null);
    assert.equal(replaceAppGroup(groups, groups[0], groups[1]), null);
});

test('moves groups up and down without mutating the original list', () => {
    const groups = ['A|a.desktop', 'B|b.desktop', 'C|c.desktop'];
    assert.deepEqual(moveAppGroup(groups, groups[2], -1), [groups[0], groups[2], groups[1]]);
    assert.deepEqual(moveAppGroup(groups, groups[0], 1), [groups[1], groups[0], groups[2]]);
    assert.deepEqual(moveAppGroup(groups, groups[0], -1), groups);
    assert.deepEqual(groups, ['A|a.desktop', 'B|b.desktop', 'C|c.desktop']);
});
