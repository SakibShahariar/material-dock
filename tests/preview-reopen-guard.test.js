import test from 'node:test';
import assert from 'node:assert/strict';

import {PreviewReopenGuard} from '../lib/preview-reopen-guard.js';

test('blocks the first hover entry after a preview is manually closed', () => {
    const guard = new PreviewReopenGuard();
    const item = {};

    guard.suppress(item);

    assert.equal(guard.shouldSuppress(item, true), true);
    assert.equal(guard.isSuppressed(item), true);
});

test('allows the same icon to reopen after the pointer leaves and re-enters', () => {
    const guard = new PreviewReopenGuard();
    const item = {};

    guard.suppress(item);
    assert.equal(guard.shouldSuppress(item, true), true);
    assert.equal(guard.shouldSuppress(item, false), false);
    assert.equal(guard.isSuppressed(item), false);
    assert.equal(guard.shouldSuppress(item, true), false);
});

test('does not clear suppression before a blocked hover entry', () => {
    const guard = new PreviewReopenGuard();
    const item = {};

    guard.suppress(item);
    assert.equal(guard.shouldSuppress(item, false), false);
    assert.equal(guard.isSuppressed(item), true);
    assert.equal(guard.shouldSuppress(item, true), true);
    assert.equal(guard.shouldSuppress(item, false), false);
});

test('moving to another icon clears the old suppression', () => {
    const guard = new PreviewReopenGuard();
    const closedItem = {};
    const otherItem = {};

    guard.suppress(closedItem);

    assert.equal(guard.shouldSuppress(otherItem, true), false);
    assert.equal(guard.isSuppressed(closedItem), false);
    assert.equal(guard.shouldSuppress(closedItem, true), false);
});

test('clears suppression when the tracked icon is destroyed', () => {
    const guard = new PreviewReopenGuard();
    const item = {};

    guard.suppress(item);
    guard.clearItem(item);

    assert.equal(guard.isSuppressed(item), false);
});
