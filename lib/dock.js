import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PointerWatcher from 'resource:///org/gnome/shell/ui/pointerWatcher.js';

import {MaterialDash, ClickAction, ScrollAction} from './dash.js';
import {RunningIndicator} from './indicators.js';
import {Magnifier} from './magnifier.js';
import {Intellihide} from './intellihide.js';
import {PreviewPopup, MinimizedTilesRow, MinimizedTracker} from './previews.js';
import {StacksRow} from './stacks.js';
import {DockContextMenu} from './contextmenu.js';
import {GlobalSignalsHandler} from './utils.js';

const REVEAL_STRIP = 8;
const ANIM_TIME = 180;

export class MaterialDock extends St.Bin {
    _init(settings, monitorIndex, onOpenPreferences) {
        super._init({
            name: 'material-dock',
            style_class: 'material-dock-card',
            reactive: false,
            track_hover: true,
        });

        this.settings = settings;
        this.monitorIndex = monitorIndex;
        this.position = settings.get_string('dock-position');
        this._monitor = Main.layoutManager.monitors[monitorIndex];

        this._onOpenPreferences = onOpenPreferences;
        this._contextMenuOpen = false;
        this._activePopover = null;
        this._requiresVisibility = false;

        this._signals = new GlobalSignalsHandler(this);
        this._intellihide = new Intellihide(monitorIndex);
        this._intellihide.setStatusCallback(overlap => this._onIntellihideStatus(overlap));

        const showTiles = settings.get_boolean('show-minimized-tiles');

        this._stacks = new StacksRow(this);
        this._dash = new MaterialDash(this, settings);
        this._minTiles = showTiles ? new MinimizedTilesRow(this, new MinimizedTracker()) : null;
        this._minTilesVisible = showTiles;

        this._contentBox = new St.BoxLayout({
            name: 'material-dock-box',
            reactive: true,
            track_hover: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });

        this._contentBox.add_child(this._stacks);
        this._contentBox.add_child(this._dash);
        if (this._minTiles)
            this._contentBox.add_child(this._minTiles);
        this.set_child(this._contentBox);

        this._magnifier = new Magnifier(this);

        this._preview = new PreviewPopup(this);
        Main.uiGroup.add_child(this._preview);
        this._preview.show();

        this._ctxMenu = new DockContextMenu(this);
        this._ctxMenu.setOnOpenPreferences(() => onOpenPreferences());

        // Show apps button bridge
        this._dash.showAppsButton.connectObject('notify::checked',
            btn => this._onShowAppsToggled(btn), this);
        Main.overview.connectObject('hidden',
            () => {
                if (this._dash.showAppsButton.checked)
                    this._dash.showAppsButton.checked = false;
            }, this);

        this._icons = new Map(); // item -> {app, indicator, ids}

        // Global window tracking for state & hover
        this._windowTracker = Main.windowTracker;
        this._signals.add(
            [this._windowTracker, 'notify::focus-app', () => this._updateAllIndicators()],
            [global.display, 'window-demands-attention', () => this._updateAllIndicators()],
            [global.display, 'restacked', () => this._updateAllIndicators()],
            [global.display, 'workareas-changed', () => this._resetPosition()],
            [Main.layoutManager, 'monitors-changed', () => this._onMonitorsChanged()],
            [this._contentBox, 'notify::allocation', () => this._resetPosition()],
            [this._dash._box, 'notify::allocation', () => this._resetPosition()]);

        this._contentBox.connectObject('notify::hover',
            () => this._updateVisibility(), this);

        // Settings
        this._bindSettings();

        this._autohideTimeId = 0;
        this._autohideMode = settings.get_string('autohide-mode');
        this._hovered = false;

        this._trackChrome();
        this._chromeTracked = true;
        this._updateAutoHideState();

        // Reveal strip detection
        this._pointerWatch = PointerWatcher.getPointerWatcher().addWatch(
            100, (x, y) => this._onPointerMove(x, y));

        this.connect('destroy', () => {
            this._cancelAutohideTimeout();
            this._pointerWatch?.remove();
            this._pointerWatch = null;
            this.closeActivePopover();
            this._intellihide.destroy();
            this._magnifier.destroy();
            this._ctxMenu.destroy();
            this._preview.destroy();
            this._stacks.destroy();
            if (this._minTiles && !this._minTiles.is_destroyed())
                this._minTiles.destroy();
            this._signals.destroy();
            if (this._chromeTracked)
                Main.layoutManager.removeChrome(this);
        });
    }

    get iconSize() {
        return this._dash.iconSize;
    }

    get dash() {
        return this._dash;
    }

    _trackChrome() {
        if (this._chromeTracked) {
            Main.layoutManager.removeChrome(this);
            this._chromeTracked = false;
        }
        const fixed = this.settings.get_boolean('dock-fixed') &&
            this.settings.get_string('autohide-mode') === 'never';
        Main.layoutManager.addChrome(this, {
            affectsStruts: fixed,
            trackFullscreen: true,
        });
        this._chromeTracked = true;
        this._resetPosition();
    }

    _onMonitorsChanged() {
        if (this.monitorIndex >= Main.layoutManager.monitors.length)
            this.monitorIndex = Main.layoutManager.primaryIndex;
        this._monitor = Main.layoutManager.monitors[this.monitorIndex];
        this._intellihide.updateMonitor(this.monitorIndex);
        this._resetPosition();
    }

    _resetPosition() {
        const monitor = Main.layoutManager.monitors[this.monitorIndex];
        if (!monitor) return;

        const [, natWidth] = this.get_preferred_width(-1);
        const [, natHeight] = this.get_preferred_height(-1);
        const width = natWidth;
        const height = natHeight;

        const alignment = this.settings.get_string('dock-alignment');
        const margin = this.settings.get_int('dock-margin');

        let x, y;
        if (this.position === 'top') {
            y = monitor.y + Main.panel.height + margin;
        } else {
            y = monitor.y + monitor.height - height - margin;
        }

        if (alignment === 'start')
            x = monitor.x + margin;
        else if (alignment === 'end')
            x = monitor.x + monitor.width - width - margin;
        else
            x = monitor.x + Math.round((monitor.width - width) / 2);

        this.set_position(Math.round(x), Math.round(y));
        this._updateStaticBox();
    }

    _updateStaticBox() {
        const box = new Clutter.ActorBox();
        box.init_rect(this.x, this.y, this.width, this.height);
        this._intellihide.updateTargetBox(this._boxRect(box));
    }

    _boxRect(box) {
        const tx = this.translation_x;
        const ty = this.translation_y;
        return new Clutter.ActorBox({
            x1: box.x1 + tx,
            y1: box.y1 + ty,
            x2: box.x2 + tx,
            y2: box.y2 + ty,
        });
    }

    _bindSettings() {
        const keys = [
            'icon-size', 'dock-position', 'dock-alignment', 'dock-margin',
            'dock-fixed', 'autohide-mode', 'running-indicator',
            'magnify-enabled', 'magnify-effect', 'magnify-scale', 'magnify-range',
            'show-favorites', 'show-running', 'show-show-apps-button',
            'show-minimized-tiles', 'show-previews', 'folder-stacks', 'app-groups',
            'click-action', 'scroll-action', 'auto-fit-icons',
        ];
        for (const key of keys) {
            this._signals.add(this.settings, `changed::${key}`,
                () => this._onSettingChanged(key));
        }
    }

    _onSettingChanged(key) {
        switch (key) {
        case 'dock-position':
            this.position = this.settings.get_string('dock-position');
            this._resetPosition();
            this._updateStaticBox();
            break;
        case 'dock-alignment':
        case 'dock-margin':
            this._resetPosition();
            break;
        case 'dock-fixed':
        case 'autohide-mode':
            this._autohideMode = this.settings.get_string('autohide-mode');
            this._trackChrome();
            this._updateAutoHideState();
            this._resetPosition();
            break;
        case 'icon-size':
            this._dash.setIconSize(this.settings.get_int('icon-size'));
            this._resetPosition();
            break;
        case 'show-favorites':
        case 'show-running':
        case 'show-show-apps-button':
            this._dash.onSettingsChanged();
            this._resetPosition();
            break;
        case 'folder-stacks':
        case 'app-groups':
            this._stacks.refresh(
                this.settings.get_strv('folder-stacks'),
                this.settings.get_strv('app-groups'));
            this._resetPosition();
            break;
        case 'show-minimized-tiles':
            this._setMinTilesVisible(this.settings.get_boolean('show-minimized-tiles'));
            break;
        case 'magnify-enabled':
        case 'magnify-effect':
        case 'magnify-scale':
        case 'magnify-range':
            this._magnifier.onSettingsChanged();
            break;
        }
    }

    _setMinTilesVisible(visible) {
        if (visible && !this._minTiles) {
            this._minTiles = new MinimizedTilesRow(this, new MinimizedTracker());
            this._contentBox.add_child(this._minTiles);
        } else if (!visible && this._minTiles) {
            this._minTiles.destroy();
            this._minTiles = null;
        }
        this._minTilesVisible = visible;
        this._resetPosition();
    }

    // ---- items & indicators ----

    onAppItemCreated(item, app) {
        const indicator = new RunningIndicator();
        item.add_child(indicator);

        const stateHandler = () => this._updateIndicator(item, app);
        const ids = [
            app.connect('notify::state', stateHandler),
            app.connect('windows-changed', stateHandler),
        ];

        this._icons.set(item, {app, indicator, ids});
        this._updateIndicator(item, app);

        // Magnification
        const iconWidget = item.child;
        if (iconWidget) {
            iconWidget.connect('notify::hover', () =>
                this._magnifier.onItemHover(item, iconWidget.hover));

            iconWidget.connect('notify::mapped', () => {
                if (!iconWidget.mapped && this._magnifier)
                    this._magnifier.onItemHover(item, false);
            });

            // Preview on dwell-out; closed on leave
            iconWidget.connect('notify::hover', () => {
                const showing = this.settings.get_boolean('show-previews');
                if (iconWidget.hover) {
                    this._preview.scheduleShow(item, app);
                } else {
                    this._preview.closePreviews();
                }
                this._syncLabels();
            });
        }

        item.connect('destroy', () => {
            for (const id of ids) {
                try { app.disconnect(id); } catch {}
            }
            this._icons.delete(item);
            this._preview.closePreviews();
        });
    }

    _updateIndicator(item, app) {
        const entry = this._icons.get(item);
        if (!entry) return;

        const {indicator} = entry;
        const style = this.settings.get_string('running-indicator');
        const running = app.state !== Shell.AppState.STOPPED;
        const focused = this._windowTracker.focusApp === app;
        const windows = app.get_windows().filter(w => !w.is_skip_taskbar());
        const urgent = windows.some(w => w.is_demands_attention());

        if (style === 'none') {
            indicator.hide();
            return;
        }
        indicator.show();

        if (style === 'bars')
            indicator.updateForBars(running, focused, urgent, windows.length);
        else
            indicator.updateState(running, focused, urgent, windows.length);
    }

    _updateAllIndicators() {
        for (const [item, entry] of this._icons)
            this._updateIndicator(item, entry.app);
    }

    // ---- click / scroll semantics ----

    onAppIconClick(icon, button) {
        const app = icon.app;
        const action = this.settings.get_string('click-action');

        const event = Clutter.get_current_event();
        const modifiers = event ? event.get_state() : 0;
        const openNewWindow = app.can_open_new_window() &&
            (button === Clutter.BUTTON_MIDDLE ||
             (modifiers & Clutter.ModifierType.CONTROL_MASK) !== 0);

        if (Main.overview.visibleTarget)
            Main.overview.hide();

        if (app.state === Shell.AppState.STOPPED) {
            app.animate_launch?.();
            app.activate();
            return;
        }

        if (openNewWindow) {
            app.open_new_window(-1);
            return;
        }

        switch (action) {
        case ClickAction.LAUNCH:
            if (app.can_open_new_window())
                app.open_new_window(-1);
            else
                app.activate();
            break;
        case ClickAction.PREVIEWS:
            this._preview._showForItem(null, app);
            break;
        case ClickAction.CYCLE_WINDOWS:
            this._cycleWindows(icon, 1);
            break;
        case ClickAction.TOGGLE_MINIMIZE:
            this._minimizeAllWindows(app);
            break;
        case ClickAction.FOCUS:
        case ClickAction.FOCUS_OR_MINIMIZE:
        default: {
            const focused = this._windowTracker.focusApp === app;
            const windows = app.get_windows().filter(w => !w.is_skip_taskbar());

            if (action === ClickAction.FOCUS_OR_MINIMIZE && focused) {
                // MaterialDock "active" mode: clicking a focused app minimizes it.
                const current = global.display.get_focus_window();
                if (current && this._windowTracker.get_window_app(current) === app)
                    current.minimize();
                return;
            }

            if (windows.length === 0) {
                app.activate();
                return;
            }
            this._activateMostRecent(app);
        }
        }
    }

    _activateFallback(app) {
        const windows = app.get_windows().filter(w => !w.is_skip_taskbar());
        if (windows.length === 0) {
            app.activate();
            return;
        }
        const activeWs = global.workspace_manager.get_active_workspace();
        let target = windows.find(w =>
            w.get_workspace() === activeWs && !w.is_minimized() &&
            w !== global.display.get_focus_window());
        if (!target)
            target = windows.find(w => w.get_workspace() === activeWs);
        if (!target)
            target = windows[0];

        this._restoreAndFocus(target);
    }

    _activateMostRecent(app) {
        this._activateFallback(app);
    }

    _restoreAndFocus(window) {
        if (window.is_minimized())
            window.unminimize();
        window.activate(global.get_current_time());
    }

    _cycleWindows(icon, direction) {
        const windows = icon.getInterestingWindows();
        if (windows.length === 0)
            return;

        icon._cycleIndex = (icon._cycleIndex + direction + windows.length) % windows.length;
        const target = windows[icon._cycleIndex];
        this._restoreAndFocus(target);
    }

    _minimizeAllWindows(app) {
        const activeWs = global.workspace_manager.get_active_workspace();
        const windows = app.get_windows().filter(w =>
            !w.is_skip_taskbar() && w.get_workspace() === activeWs &&
            w.showing_on_its_workspace());
        for (const w of windows)
            w.minimize();
    }

    onAppIconScroll(icon, event) {
        const action = this.settings.get_string('scroll-action');
        if (action === ScrollAction.NOTHING)
            return Clutter.EVENT_STOP;

        let direction = 0;
        if (event.get_scroll_direction() === Clutter.ScrollDirection.UP)
            direction = 1;
        else if (event.get_scroll_direction() === Clutter.ScrollDirection.DOWN)
            direction = -1;

        if (action === ScrollAction.SWITCH_WORKSPACE) {
            const wsManager = global.workspace_manager;
            const current = wsManager.get_active_workspace_index();
            const next = Math.clamp(current + direction, 0, wsManager.get_n_workspaces() - 1);
            const ws = wsManager.get_workspace_by_index(next);
            if (ws)
                ws.activate(global.get_current_time());
        } else {
            const app = icon.app;
            if (app.state !== Shell.AppState.STOPPED)
                this._cycleWindows(icon, direction);
            else
                app.activate();
        }
        return Clutter.EVENT_STOP;
    }

    // ---- show apps ----

    _onShowAppsToggled(btn) {
        if (btn.checked)
            Main.overview.showApps();
        else if (Main.overview.visibleTarget)
            Main.overview.hide();
    }

    // ---- preview / label helpers ----

    closePreviews() {
        this._preview.closePreviews();
    }

    _syncLabels() {
        const anyHover = this._contentBox.hover;
        if (!anyHover) {
            for (const item of this._dash._items)
                item.hideLabel();
        }
    }

    _clearLabels() {
        for (const item of this._dash._items)
            item.hideLabel();
    }

    _previewsClearLabel() {
        this._clearLabels();
    }

    isDockHovered() {
        return this._contentBox.hover || this._preview.hover ||
            this._contextMenuOpen || this._activePopover !== null;
    }

    closeActivePopover() {
        if (this._activePopover) {
            this._activePopover.close();
            this._activePopover = null;
        }
    }

    // ---- autohide / intellihide ----

    _onIntellihideStatus(overlap) {
        if (this._autohideMode === 'intelligent')
            this._updateVisibility();
    }

    _updateAutoHideState() {
        this._autohideMode = this.settings.get_string('autohide-mode');

        if (this._autohideMode === 'intelligent') {
            this._intellihide.enable();
        } else {
            this._intellihide.disable();
        }
        this._updateVisibility();
    }

    _isHoverOverDock() {
        return this._contentBox.hover;
    }

    _onPointerMove(x, y) {
        if (!this._autohideMode || this._autohideMode === 'never')
            return;

        const monitor = Main.layoutManager.monitors[this.monitorIndex];
        if (!monitor) return;

        const inStrip = this.position === 'bottom'
            ? y >= monitor.y + monitor.height - REVEAL_STRIP &&
              x >= monitor.x && x <= monitor.x + monitor.width
            : y <= monitor.y + Main.panel.height + REVEAL_STRIP &&
              x >= monitor.x && x <= monitor.x + monitor.width;

        const visible = this.translation_y === 0;

        if (inStrip && !visible && this._contextMenuOpen === false && !this._activePopover)
            this._showNow();
        else if (this._autohideMode === 'always' && !this._isHoverOverDock())
            this._scheduleHide();
    }

    _showNow() {
        this._updateVisibility(true);
    }

    _updateVisibility(forceShow = false) {
        const never = this._autohideMode === 'never';
        if (never) {
            this._setVisible(true);
            return;
        }

        if (Main.overview.visibleTarget) {
            this._setVisible(true);
            return;
        }

        if (this.isDockHovered() || this._contextMenuOpen || this._activePopover ||
            this._preview.visible || forceShow) {
            this._setVisible(true);
            return;
        }

        if (this._autohideMode === 'always') {
            if (this._isHoverOverDock())
                this._setVisible(true);
            else
                this._scheduleHide();
        } else if (this._autohideMode === 'intelligent') {
            if (this._intellihide.getOverlap())
                this._scheduleHide();
            else
                this._setVisible(true);
        }
    }

    _scheduleHide() {
        this._cancelAutohideTimeout();
        if (!this._autohideTimeId) {
            const delay = this.settings.get_int('autohide-timeout');
            this._autohideTimeId = GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, delay,
                () => {
                    this._autohideTimeId = 0;
                    if (!this.isDockHovered() && !this._contextMenuOpen &&
                        !this._activePopover && !this._preview.visible) {
                        if (this._autohideMode === 'always' ||
                            this._intellihide.getOverlap())
                            this._setVisible(false);
                    }
                });
            GLib.Source.set_name_by_id(this._autohideTimeId, '[material-dock] autohide');
        }
    }

    _cancelAutohideTimeout() {
        if (this._autohideTimeId) {
            GLib.source_remove(this._autohideTimeId);
            this._autohideTimeId = 0;
        }
    }

    _setVisible(visible) {
        const hidden = (this.translation_y !== 0);
        if (visible === !hidden)
            return;

        this._cancelAutohideTimeout();

        const height = this.height || 0;
        const margin = this.settings.get_int('dock-margin');
        const offset = (height + margin) * (this.position === 'top' ? -1 : 1);
        const target = visible ? 0 : offset;

        this.ease({
            translation_y: target,
            duration: ANIM_TIME,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => Main.layoutManager._queueUpdateRegions(),
        });
    }

    _onOverviewShowing() {
        this._setVisible(true);
    }

    _onOverviewHiding() {
        this._updateVisibility();
    }
}