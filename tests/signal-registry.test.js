import test from 'node:test';
import assert from 'node:assert/strict';

import {SignalRegistry} from '../lib/signal-registry.js';

function mockSignalObject() {
    let nextId = 1;
    const handlers = new Map();
    return {
        handlers,
        connect(name, callback) {
            const id = nextId++;
            handlers.set(id, {name, callback});
            return id;
        },
        disconnect(id) {
            if (!handlers.has(id)) throw new Error('unknown signal handler');
            handlers.delete(id);
        },
        is_destroyed() {
            return false;
        },
    };
}

test('disconnects all tracked signals during destroy', () => {
    const a = mockSignalObject();
    const b = mockSignalObject();
    const registry = new SignalRegistry();
    registry.add(a, 'changed', () => {});
    registry.add([b, 'notify::state', () => {}]);

    assert.equal(a.handlers.size, 1);
    assert.equal(b.handlers.size, 1);
    registry.destroy();
    assert.equal(a.handlers.size, 0);
    assert.equal(b.handlers.size, 0);
});

test('disconnectAll is idempotent and can be called repeatedly', () => {
    const object = mockSignalObject();
    const registry = new SignalRegistry();
    registry.add(object, 'changed', () => {});
    registry.disconnectAll();
    registry.disconnectAll();
    assert.equal(object.handlers.size, 0);
});

test('skips disconnecting handlers on already-destroyed signal objects', () => {
    const object = mockSignalObject();
    object.is_destroyed = () => true;
    const registry = new SignalRegistry();
    registry.add(object, 'changed', () => {});
    registry.destroy();
    assert.equal(object.handlers.size, 1);
});
