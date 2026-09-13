import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const PREVIEW_POPUP_DWELL = 600;
const MAX_PREVIEW_WINDOWS = 6;

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
            if (win.is_minimized() && !win.is_skip_taskbar())
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

        const app = Main.windowTracker.get_window_app(win);
        const icon = app?.create_icon_texture(dock.iconSize) ?? new St.Icon({
            icon_name: 'image-missing',
            icon_size: dock.iconSize,
        });

        const title = win.get_title() || app?.get_name() || 'Window';
        const label = new St.Label({
            text: title,
            style_class: 'material-dock-preview-title',
            x_align: Clutter.ActorAlign.CENTER,
            ellipsize: 3, // Pango.EllipsizeMode.END
        });

        const minimized = win.is_minimized();
        if (minimized)
            this.add_style_pseudo_class('minimized');

        const box = new St.BoxLayout({
            vertical: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        box.add_child(icon);
        box.add_child(label);

        this.child = box;

        this.connect('clicked', () => {
            if (win.is_minimized()) {
                win.unminimize();
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
        this._hoverId = 0;
        this._timeoutId = 0;
        this._isReactive = true;
        this._menuSide = null;

        this._widgets = [];

        // Keep open while cursor inside the popup.
        this.connect('notify::hover', () => {
            if (!this.hover && !this._dock.isDockHovered())
                this.closePreviews();
        });

        this.connect('destroy', () => {
            if (this._timeoutId > 0) {
                GLib.source_remove(this._timeoutId);
                this._timeoutId = 0;
            }
        });
    }

    _showForItem(item, app) {
        this._app = app;
        const windows = app.get_windows().filter(w => !w.is_skip_taskbar());

        this.destroy_all_children();

        if (windows.length === 0) {
            const label = new St.Label({
                text: app.get_name(),
                style_class: 'material-dock-preview-empty',
            });
            this.add_child(label);
        } else {
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
        }

        this._reposition();
        this.show();
        this._dock._previewsClearLabel();
    }

    _reposition() {
        const dock = this._dock;
        const [stageX, stageY] = dock.get_transformed_position();
        const monitor = Main.layoutManager.monitors[dock.monitorIndex];

        const padding = 10;
        const height = this.get_preferred_height(-1)[1];

        let x, y;
        if (dock.position === 'top') {
            y = stageY + dock.height + padding;
        } else {
            y = stageY - height - padding;
        }

        const width = this.get_preferred_width(-1)[1];
        x = stageX + (dock.width - width) / 2;

        if (monitor) {
            x = Math.clamp(x, monitor.x + 8, monitor.x + monitor.width - width - 8);
            y = Math.clamp(y + 8, monitor.y + 8, monitor.y + monitor.height - height - 8);
        }

        this.set_position(Math.round(x), Math.round(y));
    }

    scheduleShow(item, app) {
        if (this._timeoutId > 0)
            GLib.source_remove(this._timeoutId);
        this._timeoutId = GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, PREVIEW_POPUP_DWELL,
            () => {
                this._timeoutId = 0;
                this._showForItem(item, app);
            });
    }

    closePreviews() {
        if (this._timeoutId > 0) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        if (!this.visible)
            return;
        this.hide();
        this.destroy_all_children();
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

        this.connect('destroy', () => this._tracker.setOnChanged(null));
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

        const app = Main.windowTracker.get_window_app(win);
        const icon = app?.create_icon_texture(this._dock.iconSize - 14) ?? new St.Icon({
            icon_name: 'image-missing',
            icon_size: this._dock.iconSize - 14,
        });
        const title = win.get_title() || app?.get_name() || 'Window';
        const label = new St.Label({
            text: title,
            style_class: 'material-dock-min-tile-label',
            ellipsize: 3,
            y_align: Clutter.ActorAlign.CENTER,
        });

        const closeBtn = new St.Button({
            style_class: 'material-dock-min-tile-close',
            track_hover: true,
            reactive: true,
            child: new St.Icon({
                icon_name: 'window-close-symbolic',
                icon_size: 10,
            }),
        });
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
            if (win.is_minimized())
                win.unminimize();
            win.activate(global.get_current_time());
        });

        this.add_child(tile);
        this._tiles.set(win, tile);
        tile.connect('destroy', () => this._tiles.delete(win));
    }
});