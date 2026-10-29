/**
 * Tracks signal connections and reliably disconnects them during teardown.
 * Kept free of GNOME imports so the lifecycle contract can be unit-tested.
 */
export class SignalRegistry {
    constructor(owner = null) {
        this._owner = owner;
        this._bindings = [];
    }

    add(...args) {
        let triples;
        if (args.length === 3 && typeof args[1] === 'string') {
            triples = [args];
        } else if (Array.isArray(args[0]) && Array.isArray(args[0][0])) {
            triples = args[0];
        } else {
            triples = args;
        }

        for (const [obj, signalName, callback] of triples) {
            const handlerId = obj.connect(signalName, callback);
            this._bindings.push({obj, handlerId});
        }
    }

    disconnectAll() {
        for (const {obj, handlerId} of this._bindings) {
            if (obj && !obj.is_destroyed?.()) obj.disconnect(handlerId);
        }
        this._bindings = [];
    }

    destroy() {
        this.disconnectAll();
    }
}
