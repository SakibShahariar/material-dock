import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Main from 'resource:///org/gnome/shell/ui/main.js';

const HANDLED_WINDOW_TYPES = [
    Meta.WindowType.NORMAL,
    Meta.WindowType.DIALOG,
    Meta.WindowType.MODAL_DIALOG,
    Meta.WindowType.UTILITY,
    Meta.WindowType.TOOLBAR,
    Meta.WindowType.MENU,
    Meta.WindowType.SPLASHSCREEN,
    Meta.WindowType.DROPDOWN_MENU,
];

export class Intellihide {
    constructor(monitorIndex) {
        this._monitorIndex = monitorIndex;
        this._enabled = false;
        this._overlap = false;
        this._targetBox = null;
        this._checkTimeoutId = 0;
        this._signals = [];

        this._tracker = Shell.WindowTracker.get_default();
    }

    enable() {
        if (this._enabled) return;
        this._enabled = true;
        this._connectSignals();
        this._queueCheck();
    }

    disable() {
        this._enabled = false;
        this._disconnectSignals();
        if (this._checkTimeoutId > 0) {
            GLib.source_remove(this._checkTimeoutId);
            this._checkTimeoutId = 0;
        }
    }

    updateTargetBox(box) {
        this._targetBox = box;
        this._queueCheck();
    }

    updateMonitor(index) {
        this._monitorIndex = index;
        this._queueCheck();
    }

    getOverlap() {
        return this._overlap;
    }

    _connectSignals() {
        const display = global.display;
        this._signals.push(
            display.connect('window-created', () => this._queueCheck()),
            display.connect('restacked', () => this._queueCheck()),
            display.connect('window-demands-attention', () => this._queueCheck()),
            this._tracker.connect('notify::focus-app', () => this._queueCheck()),
        );

        const wsManager = global.workspace_manager;
        this._signals.push(
            wsManager.connect('active-workspace-changed', () => this._queueCheck()),
        );
    }

    _disconnectSignals() {
        const display = global.display;
        const wsManager = global.workspace_manager;
        for (const id of this._signals) {
            if (typeof id === 'number') {
                // GObject signal id - could be from display, tracker, or wsManager
                try { display.disconnect(id); } catch {}
                try { this._tracker.disconnect(id); } catch {}
                try { wsManager.disconnect(id); } catch {}
            }
        }
        this._signals = [];
    }

    _queueCheck() {
        if (!this._enabled || this._checkTimeoutId > 0) return;
        this._checkTimeoutId = GLib.timeout_add(GLib.PRIORITY_LOW, 150, () => {
            this._checkTimeoutId = 0;
            this._checkOverlap();
            return GLib.SOURCE_REMOVE;
        });
    }

    _checkOverlap() {
        if (!this._targetBox || !this._enabled) return;

        const monitor = Main.layoutManager.monitors[this._monitorIndex];
        if (!monitor) return;

        const activeWs = global.workspace_manager.get_active_workspace();
        const display = global.display;
        const windows = display.get_tab_list(0, activeWs);

        const tx1 = this._targetBox.x1;
        const ty1 = this._targetBox.y1;
        const tx2 = this._targetBox.x2;
        const ty2 = this._targetBox.y2;

        let overlap = false;

        for (const win of windows) {
            if (win.is_minimized()) continue;
            if (win.is_skip_taskbar()) continue;

            const wtype = win.get_window_type();
            if (!HANDLED_WINDOW_TYPES.includes(wtype)) continue;

            const monitorIndex = win.get_monitor();
            if (monitorIndex !== this._monitorIndex) continue;

            const rect = win.get_frame_rect();
            if (!rect) continue;

            if (rect.x < tx2 && (rect.x + rect.width) > tx1 &&
                rect.y < ty2 && (rect.y + rect.height) > ty1) {
                overlap = true;
                break;
            }
        }

        if (overlap !== this._overlap) {
            this._overlap = overlap;
            this.emit?.('status-changed');
        }
    }

    emit(signalName) {
        if (this._statusCallback)
            this._statusCallback(this._overlap);
    }

    setStatusCallback(cb) {
        this._statusCallback = cb;
    }

    destroy() {
        this.disable();
    }
}
