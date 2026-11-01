import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import {SignalRegistry} from './signal-registry.js';

export class GlobalSignalsHandler extends SignalRegistry {}

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
    const id = global.compositor.get_laters().add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        callback();
        return GLib.SOURCE_REMOVE;
    });
    return id;
}

export function formatSize(bytes) {
    return GLib.format_size(bytes);
}

export function formatRelativeTime(mtimeSec) {
    const now = Math.floor(Number(GLib.get_real_time()) / 1000000);
    const diff = Math.max(0, now - mtimeSec);
    const formatter = new Intl.RelativeTimeFormat(undefined, {
        numeric: 'auto',
        style: 'short',
    });

    if (diff < 60) return formatter.format(-diff, 'second');
    if (diff < 3600) return formatter.format(-Math.floor(diff / 60), 'minute');
    if (diff < 86400) return formatter.format(-Math.floor(diff / 3600), 'hour');
    if (diff < 30 * 86400) return formatter.format(-Math.floor(diff / 86400), 'day');
    if (diff < 365 * 86400) return formatter.format(-Math.floor(diff / (30 * 86400)), 'month');
    return formatter.format(-Math.floor(diff / (365 * 86400)), 'year');
}

export function log(msg) {
    // Enable verbose diagnostics explicitly in the GNOME Shell process.
    // Never write app/window activity to a predictable shared /tmp file.
    if (GLib.getenv('MATERIAL_DOCK_DEBUG') !== '1') return;

    console.debug(`[material-dock] ${msg}`);
}

export function getAppWindows(app) {
    const tracker = Shell.WindowTracker.get_default();
    return global.display
        .get_tab_list(0, global.workspace_manager.get_active_workspace())
        .filter(w => tracker.get_window_app(w) === app);
}
