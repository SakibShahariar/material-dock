import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Pango from 'gi://Pango';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {log} from './utils.js';
import {buildHoverCorridor, pointInRect} from './pointer-corridor.js';

const PREVIEW_POPUP_DWELL = 400;
const MAX_PREVIEW_WINDOWS = 6;
const HOVER_POLL_MS = 50;
const HOVER_CORRIDOR_PAD = 60;

export class MinimizedTracker {
    constructor() {
        this._windows = new Map(); // window -> {win, signalIds}
        this._display = global.display;

        this._displayId = this._display.connect('window-created',
            (_d, win) => this._onWindowAdded(win));

        for (const win of this._getAllWindows())
            this._onWindowAdded(win);
    }

    _getAllWindows() {
        return global.get_window_actors().map(a => a.metaWindow);
    }

    _onWindowAdded(win) {
        if (this._windows.has(win)) {
            this._updateWindow(win);
            return;
        }

        const signalIds = [];
        signalIds.push(win.connect('notify::minimized', () => this._updateWindow(win)));
        signalIds.push(win.connect('notify::skip-taskbar', () => this._updateWindow(win)));
        signalIds.push(win.connect('unmanaged', () => this._onWindowDestroyed(win)));

        this._windows.set(win, signalIds);
        this._emitChanged();
    }

    _onWindowDestroyed(win) {
        const signalIds = this._windows.get(win);
        if (!signalIds)
            return;
        for (const id of signalIds) {
            try { win.disconnect(id); } catch {}
        }
        this._windows.delete(win);
        this._emitChanged();
    }

    _updateWindow(win) {
        this._emitChanged();
    }

    _emitChanged() {
        this.emit?.('changed');
    }

    getMinimized() {
        const result = [];
        for (const [win] of this._windows) {
            if (win.minimized && !win.skip_taskbar)
                result.push(win);
        }
        return result;
    }

    setOnChanged(cb) {
        this._changedCallback = cb;
    }

    emit() {
        if (this._changedCallback)
            this._changedCallback();
    }

    destroy() {
        for (const [win, signalIds] of this._windows) {
            for (const id of signalIds) {
                try { win.disconnect(id); } catch {}
            }
        }
        this._windows.clear();
        try { this._display.disconnect(this._displayId); } catch {}
    }
}

const PreviewWindowButton = GObject.registerClass(
class PreviewWindowButton extends St.Button {
    _init(win, dock) {
        super._init({
            style_class: 'material-dock-preview-button',
            track_hover: true,
            reactive: true,
            can_focus: true,
        });

        this._win = win;
        this._dock = dock;

        const app = Shell.WindowTracker.get_default().get_window_app(win);
        const icon = app?.create_icon_texture(dock.iconSize) ?? new St.Icon({
            icon_name: 'image-missing',
            icon_size: dock.iconSize,
        });

        const title = win.get_title() || app?.get_name() || 'Window';
        const label = new St.Label({
            text: title,
            style_class: 'material-dock-preview-title',
            x_align: Clutter.ActorAlign.CENTER,
        });
        label.clutter_text.ellipsize = Pango.EllipsizeMode.END;

        const minimized = win.minimized;
        if (minimized)
            this.add_style_pseudo_class('minimized');

        const closeButton = new St.Button({
            style_class: 'material-dock-preview-close',
            reactive: true,
            can_focus: true,
            track_hover: true,
            x_align: Clutter.ActorAlign.END,
            child: new St.Icon({
                icon_name: 'window-close-symbolic',
                icon_size: 10,
            }),
        });
        // Keep the nested close button's pointer event from reaching the
        // parent preview button, whose click handler activates the window.
        closeButton.connect('button-press-event', () => Clutter.EVENT_STOP);
        closeButton.connect('clicked', () => {
            win.delete(global.get_current_time());
            dock.closePreviews();
        });

        const box = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        box.add_child(closeButton);
        box.add_child(icon);
        box.add_child(label);

        this.child = box;

        this.connect('button-press-event', (_actor, event) => {
            if (event.get_button() !== Clutter.BUTTON_MIDDLE)
                return Clutter.EVENT_PROPAGATE;

            // Match the minimized-window tile convention: middle-click closes.
            // Meta.Window.delete() asks the client to close gracefully.
            win.delete(global.get_current_time());
            dock.closePreviews();
            return Clutter.EVENT_STOP;
        });
        this.connect('clicked', () => {
            if (win.minimized) {
                win.minimized = false;
                win.activate(global.get_current_time());
            } else {
                win.activate(global.get_current_time());
            }
            dock.closePreviews();
        });
        this.connect('destroy', () => {
            this._dock = null;
            this._win = null;
        });
    }
});

export const PreviewPopup = GObject.registerClass({
    Signals: {'closed': {}},
}, class PreviewPopup extends St.BoxLayout {
    _init(dock) {
        super._init({
            style_class: 'material-dock-preview-panel',
            reactive: true,
            track_hover: true,
            x_expand: false,
            y_expand: false,
        });
        this._dock = dock;
        this._app = null;
        this._item = null;
        this._appWindowsChangedId = 0;
        this._hoverId = 0;
        this._timeoutId = 0;
        this._pollId = 0;
        this._isReactive = true;
        this._menuSide = null;

        this._widgets = [];

        this.connect('destroy', () => {
            this._stopPoll();
            this._disconnectAppSignals();
            if (this._timeoutId > 0) {
                GLib.source_remove(this._timeoutId);
                this._timeoutId = 0;
            }
        });
    }

    _getDockRect() {
        const dock = this._dock;
        const [sx, sy] = dock.get_transformed_position();
        return {x1: sx, y1: sy, x2: sx + dock.width, y2: sy + dock.height};
    }

    _getPanelRect() {
        const [px, py] = this.get_transformed_position();
        return {x1: px, y1: py, x2: px + this.width, y2: py + this.height};
    }

    _getHoverRect() {
        return buildHoverCorridor(
            this._getPanelRect(), this._getDockRect(), HOVER_CORRIDOR_PAD);
    }

    _pointerInside(rect) {
        const [px, py] = global.get_pointer();
        return pointInRect(px, py, rect);
    }

    _startPoll() {
        this._stopPoll();
        this._pollId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, HOVER_POLL_MS, () => {
            if (!this.visible) {
                // The source is already returning REMOVE; clear its ID without
                // trying to remove the currently-dispatching source.
                this._pollId = 0;
                return GLib.SOURCE_REMOVE;
            }
            try {
                if (this._pointerInside(this._getHoverRect()))
                    return GLib.SOURCE_CONTINUE;
            } catch (e) {
                // A panel or dock actor can disappear during teardown. Stop
                // polling rather than leaving a failed source marked active.
                log(`PREVIEW poll: corridor check failed: ${e}`);
            }

            log('PREVIEW poll: pointer left corridor, closing');
            // Clear the active source ID before closePreviews() performs its
            // normal cleanup, so it cannot remove this callback mid-dispatch.
            this._pollId = 0;
            this.closePreviews();
            return GLib.SOURCE_REMOVE;
        });
        GLib.Source.set_name_by_id(this._pollId, '[material-dock] preview hover poll');
    }

    _stopPoll() {
        const pollId = this._pollId;
        // Clear ownership before removal so re-entrant close/destroy paths
        // cannot attempt to cancel the same source twice.
        this._pollId = 0;
        if (pollId) {
            try { GLib.source_remove(pollId); } catch {}
        }
    }

    _disconnectAppSignals() {
        if (this._app && this._appWindowsChangedId) {
            try { this._app.disconnect(this._appWindowsChangedId); } catch {}
        }
        this._appWindowsChangedId = 0;
    }

    _showForItem(item, app) {
        const windows = app.get_windows().filter(w => !w.skip_taskbar);
        log(`PREVIEW show app=${app.get_id()?.slice(0,20)} nWindows=${windows.length}`);

        if (windows.length === 0) {
            this.closePreviews();
            return;
        }

        if (this._app !== app) {
            this._disconnectAppSignals();
            this._app = app;
            this._appWindowsChangedId = app.connect('windows-changed', () => {
                if (this.visible && this._app === app)
                    this._showForItem(this._item, app);
            });
        }
        this._item = item;
        this.destroy_all_children();

        for (const win of windows.slice(0, MAX_PREVIEW_WINDOWS)) {
            const btn = new PreviewWindowButton(win, this._dock);
            this.add_child(btn);
        }
        if (windows.length > MAX_PREVIEW_WINDOWS) {
            const more = new St.Label({
                text: `+${windows.length - MAX_PREVIEW_WINDOWS}`,
                style_class: 'material-dock-preview-more',
            });
            this.add_child(more);
        }

        this._reposition(item);
        this.show();
        this._dock._previewsClearLabel();
        this._startPoll();
    }

    _reposition(item = null) {
        const dock = this._dock;
        const [dockX, dockY] = dock.get_transformed_position();
        const monitor = Main.layoutManager.monitors[dock.monitorIndex];
        const padding = 10;
        const height = this.get_preferred_height(-1)[1];
        const width = this.get_preferred_width(-1)[1];

        let x;
        let y;
        if (dock._dockPosition === 'top')
            y = dockY + dock.height + padding;
        else
            y = dockY - height - padding;

        if (item?.get_stage()) {
            const [itemX] = item.get_transformed_position();
            x = itemX + (item.width - width) / 2;
        } else {
            x = dockX + (dock.width - width) / 2;
        }

        if (monitor) {
            const maxX = Math.max(monitor.x + 8, monitor.x + monitor.width - width - 8);
            const maxY = Math.max(monitor.y + 8, monitor.y + monitor.height - height - 8);
            x = Math.max(monitor.x + 8, Math.min(x, maxX));
            y = Math.max(monitor.y + 8, Math.min(y, maxY));
        }

        log(`PREVIEW reposition x=${Math.round(x)} y=${Math.round(y)} itemAnchored=${!!item?.get_stage()}`);
        this.set_position(Math.round(x), Math.round(y));
    }

    cancelScheduledShow() {
        if (this._timeoutId > 0) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
    }

    scheduleShow(item, app) {
        this.cancelScheduledShow();

        if (!app.get_windows().some(win => !win.skip_taskbar)) {
            this.closePreviews();
            return;
        }

        log(`PREVIEW schedule item=${app.get_id()?.slice(0,20)} dockStage=${!!this._dock.get_stage()}`);
        this._timeoutId = GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, PREVIEW_POPUP_DWELL,
            () => {
                this._timeoutId = 0;
                log(`PREVIEW firing show for ${app.get_id()?.slice(0,20)}`);
                this._showForItem(item, app);
            });
    }

    closePreviews() {
        this._stopPoll();
        this.cancelScheduledShow();
        this._disconnectAppSignals();
        this._app = null;
        this._item = null;

        const wasVisible = this.visible;
        if (wasVisible) {
            log('PREVIEW close');
            this.hide();
        }

        // Cleanup is deliberately idempotent: a hidden panel can still have
        // stale children after interrupted or repeated show/close transitions.
        this.destroy_all_children();

        if (wasVisible)
            this.emit('closed');
    }
});

export const MinimizedTilesRow = GObject.registerClass(
class MinimizedTilesRow extends St.BoxLayout {
    _init(dock, tracker) {
        super._init({
            style_class: 'material-dock-min-tiles',
            reactive: true,
            track_hover: true,
            x_expand: false,
        });
        this._dock = dock;
        this._tracker = tracker;
        this._tiles = new Map();

        this._tracker.setOnChanged(() => this._refresh());
        this._refresh();

        this.connect('destroy', () => {
            this._tracker.setOnChanged(null);
            this._tracker.destroy();
        });
    }

    refreshIconSize() {
        for (const win of [...this._tiles.keys()]) {
            this._tiles.get(win)?.destroy();
            this._tiles.delete(win);
            if (win.minimized && !win.skip_taskbar)
                this._addTile(win);
        }
        this.visible = this._tiles.size > 0;
    }

    _refresh() {
        const minimized = this._tracker.getMinimized().map(w => w);
        const current = new Set(this._tiles.keys());

        for (const win of minimized) {
            if (!current.has(win))
                this._addTile(win);
        }
        for (const win of current) {
            if (!minimized.includes(win)) {
                this._tiles.get(win)?.destroy();
                this._tiles.delete(win);
            }
        }
        this.visible = this._tiles.size > 0;
    }

    _addTile(win) {
        const tile = new St.Button({
            style_class: 'material-dock-min-tile',
            track_hover: true,
            reactive: true,
            can_focus: true,
        });

        const app = Shell.WindowTracker.get_default().get_window_app(win);
        const icon = app?.create_icon_texture(this._dock.iconSize - 14) ?? new St.Icon({
            icon_name: 'image-missing',
            icon_size: this._dock.iconSize - 14,
        });
        const title = win.get_title() || app?.get_name() || 'Window';
        const label = new St.Label({
            text: title,
            style_class: 'material-dock-min-tile-label',
            y_align: Clutter.ActorAlign.CENTER,
        });
        label.clutter_text.ellipsize = Pango.EllipsizeMode.END;

        const closeBtn = new St.Button({
            style_class: 'material-dock-min-tile-close',
            track_hover: true,
            reactive: true,
            child: new St.Icon({
                icon_name: 'window-close-symbolic',
                icon_size: 10,
            }),
        });
        // Prevent closing a minimized tile from also activating its parent.
        closeBtn.connect('button-press-event', () => Clutter.EVENT_STOP);
        closeBtn.connect('clicked', () => win.close(global.get_current_time()));

        const box = new St.BoxLayout({
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.CENTER,
        });
        box.add_child(icon);
        box.add_child(label);
        box.add_child(closeBtn);

        tile.child = box;
        tile.connect('clicked', () => {
            if (win.minimized)
                win.minimized = false;
            win.activate(global.get_current_time());
        });

        this.add_child(tile);
        this._tiles.set(win, tile);
        tile.connect('destroy', () => this._tiles.delete(win));
    }
});