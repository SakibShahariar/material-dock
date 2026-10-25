import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import {rectsOverlap} from './geometry.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

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
        this._windowSignals = new Map();

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
            {object: display, id: display.connect('window-created', (_display, win) => {
                this._trackWindow(win);
                this._queueCheck();
            })},
            {object: display, id: display.connect('restacked', () => this._queueCheck())},
            {object: display, id: display.connect('window-demands-attention', () => this._queueCheck())},
            {object: this._tracker, id: this._tracker.connect('notify::focus-app', () => this._queueCheck())},
            {object: Main.layoutManager, id: Main.layoutManager.connect('monitors-changed', () => this._queueCheck())},
        );

        // Track geometry and visibility changes, not only window creation and
        // restacking, so intellihide can react when a window moves or resizes.
        for (const actor of global.get_window_actors())
            this._trackWindow(actor.metaWindow);

        const wsManager = global.workspace_manager;
        this._signals.push(
            {object: wsManager, id: wsManager.connect('active-workspace-changed', () => this._queueCheck())},
        );
    }

    _trackWindow(win) {
        if (!win || this._windowSignals.has(win))
            return;

        const ids = [
            win.connect('position-changed', () => this._queueCheck()),
            win.connect('size-changed', () => this._queueCheck()),
            win.connect('workspace-changed', () => this._queueCheck()),
            win.connect('notify::minimized', () => this._queueCheck()),
            win.connect('notify::skip-taskbar', () => this._queueCheck()),
            win.connect('unmanaged', () => {
                this._untrackWindow(win);
                this._queueCheck();
            }),
        ];
        this._windowSignals.set(win, ids);
    }

    _untrackWindow(win) {
        const ids = this._windowSignals.get(win);
        if (!ids)
            return;
        for (const id of ids) {
            try { win.disconnect(id); } catch {}
        }
        this._windowSignals.delete(win);
    }

    _disconnectSignals() {
        for (const {object, id} of this._signals) {
            try { object.disconnect(id); } catch {}
        }
        this._signals = [];
        for (const win of this._windowSignals.keys())
            this._untrackWindow(win);
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
        if (!this._enabled) return;

        const monitor = Main.layoutManager.monitors[this._monitorIndex];
        if (!this._targetBox || !monitor) {
            this._setOverlap(false);
            return;
        }

        const activeWs = global.workspace_manager.get_active_workspace();
        const display = global.display;
        const windows = display.get_tab_list(0, activeWs);

        const tx1 = this._targetBox.x1;
        const ty1 = this._targetBox.y1;
        const tx2 = this._targetBox.x2;
        const ty2 = this._targetBox.y2;

        let overlap = false;

        for (const win of windows) {
            if (win.minimized) continue;
            if (win.skip_taskbar) continue;

            const wtype = win.get_window_type();
            if (!HANDLED_WINDOW_TYPES.includes(wtype)) continue;

            const monitorIndex = win.monitor;
            if (monitorIndex !== this._monitorIndex) continue;

            const rect = win.get_frame_rect();
            if (!rect) continue;

            if (rectsOverlap(
                {x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y + rect.height},
                {x1: tx1, y1: ty1, x2: tx2, y2: ty2})) {
                overlap = true;
                break;
            }
        }

        this._setOverlap(overlap);
    }

    _setOverlap(overlap) {
        if (overlap === this._overlap)
            return;

        this._overlap = overlap;
        this.emit('status-changed');
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
