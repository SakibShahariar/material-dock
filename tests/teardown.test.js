import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

import {destroyAll} from '../lib/teardown.js';

function child(name, {throws = false} = {}) {
    return {
        name,
        destroyed: false,
        destroy() {
            if (throws) throw new Error(`${name} failed`);
            this.destroyed = true;
        },
    };
}

test('destroys every child in order', () => {
    const calls = [];
    const children = ['a', 'b', 'c'].map(name => ({
        name,
        destroy() {
            calls.push(name);
        },
    }));

    destroyAll(children);

    assert.deepEqual(calls, ['a', 'b', 'c']);
});

test('skips missing children', () => {
    const present = child('present');
    destroyAll([null, present, undefined]);

    assert.equal(present.destroyed, true);
});

test('continues after a failing child and reports the error', () => {
    const bad = child('bad', {throws: true});
    const good = child('good');
    const errors = [];

    destroyAll([bad, good], error => errors.push(error));

    assert.equal(good.destroyed, true);
    assert.equal(errors.length, 1);
    assert.match(errors[0].message, /bad failed/);
});

test('dock teardown disconnects globals before destroying children', () => {
    const source = readFileSync(new URL('../lib/dock.js', import.meta.url), 'utf8');
    const start = source.indexOf('        _onDestroy() {');
    assert.notEqual(start, -1, 'dock should expose _onDestroy()');
    const end = source.indexOf('\n        get iconSize()', start);
    const body = source.slice(start, end);

    assert.ok(
        body.indexOf('this._signals.destroy()') < body.indexOf('destroyAll('),
        'signals must be disconnected before child actors are destroyed',
    );
    assert.doesNotMatch(body, /is_destroyed\(\)/, 'is_destroyed() is not a GJS method');
});
