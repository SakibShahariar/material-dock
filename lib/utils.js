import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export class GlobalSignalsHandler {
    constructor(owner) {
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
            if (obj && !obj.is_destroyed?.())
                obj.disconnect(handlerId);
        }
        this._bindings = [];
    }

    destroy() {
        this.disconnectAll();
    }
}

export function getPosition(dockPosition) {
    return dockPosition === 'top' ? 0 : 1; // St.Side.TOP=0 BOTTOM=1
}

export function getSettings(extension) {
    return extension.getSettings('org.gnome.shell.extensions.material-dock');
}

export function connectObject(obj, signals, owner) {
    for (const [target, signal, callback] of signals)
        target.connectObject(signal, callback.bind(owner), owner);
}

export function disconnectObject(owner) {
    owner.disconnectAll?.();
}

export function laterAdd(callback) {
    const id = global.compositor.get_laters().add(
        GLib.PRIORITY_DEFAULT_IDLE,
        () => {
            callback();
            return GLib.SOURCE_REMOVE;
        });
    return id;
}

export function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatRelativeTime(mtimeSec) {
    const diff = Math.floor(Number(GLib.get_real_time()) / 1000000) - mtimeSec;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export function log(msg) {
    try {
        const {Gio} = globalThis;
        const f = Gio.file_new_for_path('/tmp/material-dock.log');
        const out = f.append_to(Gio.FileCreateFlags.NONE, null);
        const enc = new TextEncoder();
        const line = `[${Math.floor(Number(GLib.get_real_time()) / 1000)}] ${msg}\n`;
        out.write_all(enc.encode(line), null);
        out.close(null);
    } catch {}
}

export function getAppWindows(app) {
    const tracker = Shell.WindowTracker.get_default();
    return global.display.get_tab_list(
        0,
        global.workspace_manager.get_active_workspace()
    ).filter(w => tracker.get_window_app(w) === app);
}
