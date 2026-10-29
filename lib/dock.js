import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PointerWatcher from 'resource:///org/gnome/shell/ui/pointerWatcher.js';

import {MaterialDash, ClickAction, ScrollAction} from './dash.js';
import {RunningIndicator} from './indicators.js';
import {Magnifier} from './magnifier.js';
import {Intellihide} from './intellihide.js';
import {PreviewPopup, MinimizedTilesRow, MinimizedTracker} from './previews.js';
import {StacksRow} from './stacks.js';
import {DockContextMenu} from './contextmenu.js';
import {GlobalSignalsHandler, log} from './utils.js';
import {calculateAutoFitIconSize} from './layout.js';
import {getVisibilityTransition} from './visibility.js';
import {accumulateSmoothScroll} from './scroll.js';
import {getNextWindowIndex} from './window-cycle.js';
import {shouldHideForShellState} from './shell-visibility.js';

const REVEAL_STRIP = 8;
const ANIM_TIME = 180;

export const MaterialDock = GObject.registerClass(
    class MaterialDock extends St.Bin {
        _init(settings, monitorIndex, onOpenPreferences) {
            super._init({
                name: 'material-dock',
                style_class: 'material-dock-card popup-menu-content',
                reactive: true,
                track_hover: true,
            });

            this.settings = settings;
            this.monitorIndex = monitorIndex;
            this._dockPosition = settings.get_string('dock-position');
            this._monitor = Main.layoutManager.monitors[monitorIndex];

            this._onOpenPreferences = onOpenPreferences;
            this._contextMenuOpen = false;
            this._activePopover = null;
            this._requiresVisibility = false;
            this._fitting = false;
            this._dockMinimizedWindows = new WeakMap();

            this._signals = new GlobalSignalsHandler(this);
            this._intellihide = new Intellihide(monitorIndex);
            this._intellihide.setStatusCallback(overlap => this._onIntellihideStatus(overlap));

            const showTiles = settings.get_boolean('show-minimized-tiles');

            this._stacks = new StacksRow(this);
            this._showDesktopButton = new St.Button({
                style_class: 'material-dock-show-desktop',
                visible: settings.get_boolean('show-desktop-button'),
                reactive: true,
                can_focus: true,
                track_hover: true,
                accessible_name: 'Show Desktop / Restore Windows',
                child: new St.Icon({
                    icon_name: 'user-desktop-symbolic',
                    icon_size: settings.get_int('icon-size'),
                }),
            });
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
            this._contentBox.add_child(this._showDesktopButton);
            this._contentBox.add_child(this._dash);
            if (this._minTiles) this._contentBox.add_child(this._minTiles);
            this.set_child(this._contentBox);

            this._magnifier = new Magnifier(this);

            this._preview = new PreviewPopup(this);
            Main.uiGroup.add_child(this._preview);
            this._preview.hide();

            this._ctxMenu = new DockContextMenu(this);
            this._ctxMenu.setOnOpenPreferences(() => onOpenPreferences());
            this._showDesktopButton.connect('clicked', () => this._ctxMenu.toggleShowDesktop());

            // Show apps button bridge
            this._dash.showAppsButton.connectObject(
                'notify::checked',
                btn => this._onShowAppsToggled(btn),
                this,
            );
            Main.overview.connectObject('showing', () => this._updateVisibility(), this);
            Main.overview.connectObject(
                'hidden',
                () => {
                    if (this._dash.showAppsButton.checked)
                        this._dash.showAppsButton.checked = false;
                    // Re-evaluate autohide after leaving Overview; otherwise the
                    // dock can remain visible until another pointer/window event.
                    this._updateVisibility();
                },
                this,
            );

            this._icons = new Map(); // item -> {app, indicator, ids}

            // Global window tracking for state & hover
            this._windowTracker = Shell.WindowTracker.get_default();
            this._signals.add(
                [this._windowTracker, 'notify::focus-app', () => this._updateAllIndicators()],
                [global.display, 'window-demands-attention', () => this._updateAllIndicators()],
                [
                    global.display,
                    'restacked',
                    () => {
                        this._updateAllIndicators();
                        this._updateVisibility();
                    },
                ],
                // Fullscreen state can change without a restack (for example when
                // an existing window toggles fullscreen). Re-evaluate the explicit
                // fullscreen visibility preference on Mutter's dedicated signal.
                [global.display, 'in-fullscreen-changed', () => this._updateVisibility()],
                [global.display, 'workareas-changed', () => this._resetPosition()],
                [Main.layoutManager, 'monitors-changed', () => this._onMonitorsChanged()],
                [this._contentBox, 'notify::allocation', () => this._resetPosition()],
                [this._dash._box, 'notify::allocation', () => this._resetPosition()],
            );

            this._contentBox.connectObject('notify::hover', () => this._updateVisibility(), this);
            // Handle right-clicks on the full dock surface, including its padding,
            // not only on the content box or individual app icons.
            this.connect('button-press-event', (_actor, event) => {
                if (event.get_button() !== Clutter.BUTTON_SECONDARY) return Clutter.EVENT_PROPAGATE;

                this._ctxMenu.popup();
                return Clutter.EVENT_STOP;
            });

            // Settings
            this._bindSettings();

            this._autohideTimeId = 0;
            this._autohideMode = settings.get_string('autohide-mode');
            this._hovered = false;
            // Track the intended visibility independently of translation_y, which
            // changes continuously during animations and is not a reliable state.
            this._visibilityState = 'visible';
            this._visibilityTransitionId = 0;

            this._trackChrome();
            this._chromeTracked = true;
            this._updateAutoHideState();

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
                if (this._minTiles && !this._minTiles.is_destroyed()) this._minTiles.destroy();
                this._signals.destroy();
                if (this._chromeTracked) Main.layoutManager.removeChrome(this);
            });
        }

        get iconSize() {
            return this._dash.iconSize;
        }

        _setIconSize(size) {
            this._dash.setIconSize(size);
            this._showDesktopButton?.child?.set_icon_size(size);
            this._minTiles?.refreshIconSize();
        }

        get dash() {
            return this._dash;
        }

        _trackChrome() {
            if (this._chromeTracked) {
                Main.layoutManager.removeChrome(this);
                this._chromeTracked = false;
            }
            const fixed =
                this.settings.get_boolean('dock-fixed') &&
                this.settings.get_string('autohide-mode') === 'never';
            Main.layoutManager.addChrome(this, {
                affectsStruts: fixed,
                trackFullscreen: true,
            });
            this._chromeTracked = true;
            this._resetPosition();
        }

        _onMonitorsChanged() {
            const monitors = Main.layoutManager.monitors;
            if (monitors.length === 0) return;

            // Resolve the configured monitor again on every topology change.
            // If it disappears, use the primary monitor temporarily; if it later
            // returns, move the dock back instead of forgetting the preference.
            let monitorIndex = this.settings.get_int('monitor-index');
            if (monitorIndex < 0 || monitorIndex >= monitors.length)
                monitorIndex = Main.layoutManager.primaryIndex;

            this.monitorIndex = monitorIndex;
            this._monitor = monitors[monitorIndex];
            this._intellihide.updateMonitor(monitorIndex);
            this._resetPosition();
        }

        _resetPosition() {
            const monitor = Main.layoutManager.monitors[this.monitorIndex];
            if (!monitor) return;

            this._updateAutoFit();

            const [, natWidth] = this.get_preferred_width(-1);
            const [, natHeight] = this.get_preferred_height(-1);
            const width = natWidth;
            const height = natHeight;
            const kids = this._contentBox
                .get_children()
                .map(
                    c =>
                        `${c.constructor.name}:${c.get_name() ?? c.style_class ?? ''}:W${c.get_preferred_width(-1)[1]}:H${c.get_preferred_height(-1)[1]}`,
                );
            const dashKids = this._dash._box?.get_children().length ?? -1;
            log(
                `POS dock prefW=${natWidth} prefH=${natHeight} iconSize=${this.iconSize} contentKids=[${kids}] dashItemCount=${dashKids}`,
            );

            const alignment = this.settings.get_string('dock-alignment');
            const margin = this.settings.get_int('dock-margin');

            let x, y;
            if (this._dockPosition === 'top') {
                const panelHeight =
                    this.monitorIndex === Main.layoutManager.primaryIndex ? Main.panel.height : 0;
                y = monitor.y + panelHeight + margin;
            } else {
                y = monitor.y + monitor.height - height - margin;
            }

            if (alignment === 'start') x = monitor.x + margin;
            else if (alignment === 'end') x = monitor.x + monitor.width - width - margin;
            else x = monitor.x + Math.round((monitor.width - width) / 2);

            this.set_position(Math.round(x), Math.round(y));
            this._updateStaticBox();
        }

        _updateAutoFit() {
            if (this._fitting) return;
            this._fitting = true;

            try {
                const configured = this.settings.get_int('icon-size');
                const autoFit = this.settings.get_boolean('auto-fit-icons');
                const current = this._dash.iconSize || configured;

                if (!autoFit) {
                    if (current !== configured) this._setIconSize(configured);
                    return;
                }

                const monitor = Main.layoutManager.monitors[this.monitorIndex];
                if (!monitor) return;

                const margin = this.settings.get_int('dock-margin');
                // Leave room for card padding, stacks, minimized tiles and a little breathing room.
                const available = Math.max(120, monitor.width - 2 * margin - 48);

                // Always measure from the configured size. Measuring a previously
                // reduced layout can make it appear to fit, then restore the size
                // and trigger another shrink on the next layout pass.
                if (current !== configured) this._setIconSize(configured);

                const [, configuredWidth] = this.get_preferred_width(-1);
                if (configuredWidth <= 0 || configuredWidth <= available) return;

                // Derive the target from the configured-size baseline on every
                // pass to avoid shrink-on-shrink layout loops.
                const newSize = calculateAutoFitIconSize(configured, available, configuredWidth);
                if (newSize !== this._dash.iconSize) this._setIconSize(newSize);
            } finally {
                this._fitting = false;
            }
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
                'icon-size',
                'dock-position',
                'dock-alignment',
                'dock-margin',
                'dock-fixed',
                'autohide-mode',
                'running-indicator',
                'magnify-enabled',
                'magnify-effect',
                'magnify-scale',
                'magnify-range',
                'hide-in-overview',
                'hide-in-fullscreen',
                'show-favorites',
                'show-running',
                'show-show-apps-button',
                'show-desktop-button',
                'current-workspace-only',
                'show-minimized-tiles',
                'show-previews',
                'folder-stacks',
                'app-groups',
                'click-action',
                'scroll-action',
                'auto-fit-icons',
            ];
            for (const key of keys) {
                this._signals.add(this.settings, `changed::${key}`, () =>
                    this._onSettingChanged(key),
                );
            }
        }

        _onSettingChanged(key) {
            switch (key) {
                case 'dock-position':
                    this._dockPosition = this.settings.get_string('dock-position');
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
                    this._setIconSize(this.settings.get_int('icon-size'));
                    this._resetPosition();
                    break;
                case 'hide-in-overview':
                case 'hide-in-fullscreen':
                    this._updateVisibility();
                    break;
                case 'show-desktop-button':
                    this._showDesktopButton.visible =
                        this.settings.get_boolean('show-desktop-button');
                    this._resetPosition();
                    break;
                case 'show-favorites':
                case 'show-running':
                case 'show-show-apps-button':
                case 'current-workspace-only':
                    this._dash.onSettingsChanged();
                    this._resetPosition();
                    break;
                case 'folder-stacks':
                case 'app-groups':
                    // Stack refresh destroys the tile that may own the active popover.
                    // Close it first so the popup cannot remain anchored to a destroyed actor.
                    this.closeActivePopover();
                    this._stacks.refresh(
                        this.settings.get_strv('folder-stacks'),
                        this.settings.get_strv('app-groups'),
                    );
                    this._resetPosition();
                    break;
                case 'show-minimized-tiles':
                    this._setMinTilesVisible(this.settings.get_boolean('show-minimized-tiles'));
                    break;
                case 'running-indicator':
                    this._updateAllIndicators();
                    break;
                case 'show-previews':
                    if (!this.settings.get_boolean('show-previews')) {
                        this._preview.closePreviews();
                    } else {
                        for (const [item, entry] of this._icons) {
                            if (item.child?.hover) this._preview.scheduleShow(item, entry.app);
                        }
                    }
                    break;
                case 'magnify-enabled':
                case 'magnify-effect':
                case 'magnify-scale':
                case 'magnify-range':
                    this._magnifier.onSettingsChanged();
                    break;
                case 'auto-fit-icons':
                    this._resetPosition();
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
            item.connect('button-press-event', (_item, event) => {
                if (event.get_button() !== Clutter.BUTTON_SECONDARY) return Clutter.EVENT_PROPAGATE;

                this._ctxMenu.popup();
                return Clutter.EVENT_STOP;
            });

            const indicator = new RunningIndicator();
            item.add_child(indicator);

            const stateHandler = () => this._updateIndicator(item, app);
            const ids = [
                app.connect('notify::state', stateHandler),
                app.connect('windows-changed', stateHandler),
                item.connect('notify::mapped', stateHandler),
            ];

            this._icons.set(item, {app, indicator, ids});
            this._updateIndicator(item, app);

            // Magnification
            const iconWidget = item.child;
            if (iconWidget) {
                iconWidget.connect('notify::hover', () => {
                    log(
                        `HOVER mag item=${iconWidget.app?.get_id()?.slice(0, 20)} hover=${iconWidget.hover}`,
                    );
                    this._magnifier.onItemHover(item, iconWidget.hover);
                });

                iconWidget.connect('notify::mapped', () => {
                    if (!iconWidget.mapped && this._magnifier)
                        this._magnifier.onItemHover(item, false);
                });

                // Preview on hover; closed by the poll once the pointer leaves the
                // dock/panel corridor (see PreviewPopup._startPoll).
                iconWidget.connect('notify::hover', () => {
                    const showing = this.settings.get_boolean('show-previews');
                    log(
                        `HOVER preview app=${app.get_id()?.slice(0, 20)} hover=${iconWidget.hover} showing=${showing}`,
                    );
                    if (iconWidget.hover && showing) this._preview.scheduleShow(item, app);
                    else this._preview.cancelScheduledShow();
                    this._syncLabels();
                });
            }

            item.connect('destroy', () => {
                for (const id of ids) {
                    try {
                        app.disconnect(id);
                    } catch {}
                }
                this._icons.delete(item);
                this._preview.closePreviews();
            });
        }

        _updateIndicator(item, app) {
            const entry = this._icons.get(item);
            if (!entry) return;

            if (!item?.get_stage()) return;

            const {indicator} = entry;
            const style = this.settings.get_string('running-indicator');
            const running = app.state !== Shell.AppState.STOPPED;
            const focused = this._windowTracker.focusApp === app;
            const windows = app.get_windows().filter(w => !w.skip_taskbar);
            const urgent = windows.some(w => w.demands_attention);

            if (style === 'none') {
                indicator.hide();
                return;
            }
            indicator.show();

            if (style === 'bars') indicator.updateForBars(running, focused, urgent, windows.length);
            else indicator.updateState(running, focused, urgent, windows.length);
            const [ix, iy] = item.get_transformed_position();
            log(
                `IND item=${app.get_id()?.slice(0, 20)} running=${running} focused=${focused} style=${style} itemStage=${ix},${iy} itemwh=${item.width}x${item.height} indwh=${indicator.width}x${indicator.height}`,
            );
        }

        _updateAllIndicators() {
            for (const [item, entry] of this._icons) this._updateIndicator(item, entry.app);
        }

        // ---- click / scroll semantics ----

        onAppIconClick(icon, button) {
            if (button === Clutter.BUTTON_SECONDARY) {
                this._ctxMenu.popup();
                return;
            }

            const app = icon.app;
            const action = this.settings.get_string('click-action');
            log(
                `CLICK app=${app.get_id()?.slice(0, 20)} button=${button} action=${action} state=${app.state}`,
            );

            const event = Clutter.get_current_event();
            const modifiers = event ? event.get_state() : 0;
            const middleClick = button === Clutter.BUTTON_MIDDLE;
            const controlClick = (modifiers & Clutter.ModifierType.CONTROL_MASK) !== 0;
            const middleClickAction = this.settings.get_string('middle-click-action');
            const openNewWindow =
                app.can_open_new_window() &&
                ((middleClick && middleClickAction === 'new-window') || controlClick);

            if (Main.overview.visibleTarget) Main.overview.hide();

            // Apply the middle-click policy before the stopped-app branch so pinned
            // apps and already-running apps follow the same rule.
            if (openNewWindow) {
                app.open_new_window(-1);
                return;
            }

            if (middleClick) {
                app.activate();
                return;
            }

            if (app.state === Shell.AppState.STOPPED) {
                app.animate_launch?.();
                app.activate();
                return;
            }

            switch (action) {
                case ClickAction.LAUNCH:
                    if (app.can_open_new_window()) app.open_new_window(-1);
                    else app.activate();
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
                    const windows = app.get_windows().filter(w => !w.skip_taskbar);

                    if (action === ClickAction.FOCUS_OR_MINIMIZE && focused) {
                        // MaterialDock "active" mode: clicking a focused app minimizes it.
                        const current = global.display.focus_window;
                        if (current && this._windowTracker.get_window_app(current) === app)
                            current.minimized = true;
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
            const windows = app.get_windows().filter(w => !w.skip_taskbar);
            if (windows.length === 0) {
                app.activate();
                return;
            }
            const activeWs = global.workspace_manager.get_active_workspace();
            let target = windows.find(
                w => w.workspace === activeWs && !w.minimized && w !== global.display.focus_window,
            );
            if (!target) target = windows.find(w => w.workspace === activeWs);
            if (!target) target = windows[0];

            this._restoreAndFocus(target);
        }

        _activateMostRecent(app) {
            this._activateFallback(app);
        }

        _restoreAndFocus(window) {
            if (window.minimized) window.minimized = false;
            window.activate(global.get_current_time());
        }

        _cycleWindows(icon, direction) {
            const windows = icon.getInterestingWindows();
            if (windows.length === 0) return;

            const focusedWindow = global.display.focus_window;
            const focusedIndex = windows.indexOf(focusedWindow);
            icon._cycleIndex = getNextWindowIndex(
                windows.length,
                focusedIndex,
                icon._cycleIndex,
                direction,
            );
            this._restoreAndFocus(windows[icon._cycleIndex]);
        }

        _minimizeAllWindows(app) {
            const tracked = this._dockMinimizedWindows.get(app);
            if (tracked?.size) {
                const currentWindows = new Set(app.get_windows());
                const toRestore = [...tracked].filter(
                    win => currentWindows.has(win) && win.minimized,
                );

                if (toRestore.length > 0) {
                    for (const win of toRestore) {
                        win.minimized = false;
                        win.activate(global.get_current_time());
                    }
                    this._dockMinimizedWindows.delete(app);
                    return;
                }

                this._dockMinimizedWindows.delete(app);
            }

            const activeWs = global.workspace_manager.get_active_workspace();
            const windows = app
                .get_windows()
                .filter(
                    w =>
                        !w.skip_taskbar &&
                        w.workspace === activeWs &&
                        w.showing_on_its_workspace() &&
                        !w.minimized,
                );
            if (windows.length === 0) return;

            for (const win of windows) win.minimized = true;
            this._dockMinimizedWindows.set(app, new Set(windows));
        }

        onAppIconScroll(icon, event) {
            const action = this.settings.get_string('scroll-action');
            if (action === ScrollAction.NOTHING) return Clutter.EVENT_STOP;

            const scrollDirection = event.get_scroll_direction();
            let direction = 0;

            if (scrollDirection === Clutter.ScrollDirection.UP) {
                direction = 1;
            } else if (scrollDirection === Clutter.ScrollDirection.DOWN) {
                direction = -1;
            } else if (scrollDirection === Clutter.ScrollDirection.SMOOTH) {
                // Touchpads emit small deltas across multiple events. Accumulate
                // them until one intentional step is reached instead of treating
                // each event as a full scroll action.
                const [, dy] = event.get_scroll_delta();
                const result = accumulateSmoothScroll(icon._smoothScrollDelta, dy);
                icon._smoothScrollDelta = result.remainder;
                if (result.direction === 0) return Clutter.EVENT_STOP;

                direction = result.direction;
            }

            // Unknown/zero-direction events must never reactivate the current
            // workspace or cycle back to the same window.
            if (direction === 0) return Clutter.EVENT_STOP;

            // Avoid rapid discrete wheel events cycling through many windows in
            // a single flick. Smooth touchpad events are already thresholded above.
            if (scrollDirection !== Clutter.ScrollDirection.SMOOTH) {
                const now = GLib.get_monotonic_time();
                if (now - (icon._lastDiscreteScrollTime ?? 0) < 100_000) return Clutter.EVENT_STOP;
                icon._lastDiscreteScrollTime = now;
            }

            if (action === ScrollAction.SWITCH_WORKSPACE) {
                const wsManager = global.workspace_manager;
                const current = wsManager.get_active_workspace_index();
                const next = Math.max(
                    0,
                    Math.min(current + direction, wsManager.get_n_workspaces() - 1),
                );
                if (next !== current) {
                    const ws = wsManager.get_workspace_by_index(next);
                    if (ws) ws.activate(global.get_current_time());
                }
            } else {
                const app = icon.app;
                if (app.state !== Shell.AppState.STOPPED) this._cycleWindows(icon, direction);
                else app.activate();
            }
            return Clutter.EVENT_STOP;
        }

        // ---- show apps ----

        _onShowAppsToggled(btn) {
            if (btn.checked) Main.overview.showApps();
            else if (Main.overview.visibleTarget) Main.overview.hide();
        }

        // ---- preview / label helpers ----

        closePreviews() {
            this._preview.closePreviews();
        }

        _syncLabels() {
            const anyHover = this._contentBox.hover;
            if (!anyHover) {
                for (const item of this._dash._items) item.hideLabel();
            }
        }

        _clearLabels() {
            for (const item of this._dash._items) item.hideLabel();
        }

        _previewsClearLabel() {
            this._clearLabels();
        }

        isDockHovered() {
            return (
                this._contentBox.hover ||
                this._preview.hover ||
                this._contextMenuOpen ||
                this._activePopover !== null
            );
        }

        closeActivePopover() {
            if (this._activePopover) {
                this._activePopover.close();
                this._activePopover = null;
            }
        }

        // ---- autohide / intellihide ----

        _onIntellihideStatus(overlap) {
            if (this._autohideMode === 'intelligent') this._updateVisibility();
        }

        _updateAutoHideState() {
            this._autohideMode = this.settings.get_string('autohide-mode');

            if (this._autohideMode === 'intelligent') {
                this._intellihide.enable();
            } else {
                this._intellihide.disable();
            }

            const needsPointerWatch = ['always', 'intelligent'].includes(this._autohideMode);
            if (needsPointerWatch && !this._pointerWatch) {
                this._pointerWatch = PointerWatcher.getPointerWatcher().addWatch(100, (x, y) =>
                    this._onPointerMove(x, y),
                );
            } else if (!needsPointerWatch && this._pointerWatch) {
                this._pointerWatch.remove();
                this._pointerWatch = null;
            }

            this._updateVisibility();
        }

        _isHoverOverDock() {
            return this._contentBox.hover;
        }

        _onPointerMove(x, y) {
            if (!this._autohideMode || this._autohideMode === 'never') return;

            const monitor = Main.layoutManager.monitors[this.monitorIndex];
            if (!monitor) return;

            const panelHeight =
                this.monitorIndex === Main.layoutManager.primaryIndex ? Main.panel.height : 0;
            const inStrip =
                this._dockPosition === 'bottom'
                    ? y >= monitor.y + monitor.height - REVEAL_STRIP &&
                      x >= monitor.x &&
                      x <= monitor.x + monitor.width
                    : y <= monitor.y + panelHeight + REVEAL_STRIP &&
                      x >= monitor.x &&
                      x <= monitor.x + monitor.width;

            const visible = ['visible', 'showing'].includes(this._visibilityState);

            if (inStrip && !visible && this._contextMenuOpen === false && !this._activePopover)
                this._showNow();
            else if (this._autohideMode === 'always' && !this._isHoverOverDock())
                this._scheduleHide();
        }

        _showNow() {
            this._updateVisibility(true);
        }

        _updateVisibility(forceShow = false) {
            const hide = shouldHideForShellState(
                Main.overview.visibleTarget,
                global.display.get_monitor_in_fullscreen(this.monitorIndex),
                this.settings.get_boolean('hide-in-overview'),
                this.settings.get_boolean('hide-in-fullscreen'),
            );
            if (hide) {
                this._setVisible(false);
                return;
            }

            const never = this._autohideMode === 'never';
            if (never) {
                this._setVisible(true);
                return;
            }

            if (Main.overview.visibleTarget) {
                this._setVisible(true);
                return;
            }

            if (
                this.isDockHovered() ||
                this._contextMenuOpen ||
                this._activePopover ||
                this._preview.visible ||
                forceShow
            ) {
                this._setVisible(true);
                return;
            }

            if (this._autohideMode === 'always') {
                if (this._isHoverOverDock()) this._setVisible(true);
                else this._scheduleHide();
            } else if (this._autohideMode === 'intelligent') {
                if (this._intellihide.getOverlap()) this._scheduleHide();
                else this._setVisible(true);
            }
        }

        _scheduleHide() {
            this._cancelAutohideTimeout();
            if (!this._autohideTimeId) {
                const delay = this.settings.get_int('autohide-timeout');
                this._autohideTimeId = GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, delay, () => {
                    this._autohideTimeId = 0;
                    if (
                        !this.isDockHovered() &&
                        !this._contextMenuOpen &&
                        !this._activePopover &&
                        !this._preview.visible
                    ) {
                        if (this._autohideMode === 'always' || this._intellihide.getOverlap())
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
            const transition = getVisibilityTransition(this._visibilityState, visible);
            if (!transition) return;

            const {stableState, transitionState} = transition;
            this._cancelAutohideTimeout();

            const height = this.height || 0;
            const margin = this.settings.get_int('dock-margin');
            const offset = (height + margin) * (this._dockPosition === 'top' ? -1 : 1);
            const target = visible ? 0 : offset;
            const transitionId = ++this._visibilityTransitionId;
            this._visibilityState = transitionState;

            this.ease({
                translation_y: target,
                duration: ANIM_TIME,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    // Ignore completion callbacks from animations that were
                    // superseded by a newer visibility request.
                    if (transitionId !== this._visibilityTransitionId) return;
                    this._visibilityState = stableState;
                    Main.layoutManager._queueUpdateRegions();
                },
            });
        }

        _onOverviewShowing() {
            this._setVisible(true);
        }

        _onOverviewHiding() {
            this._updateVisibility();
        }
    },
);
