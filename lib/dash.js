// MaterialDock dock icons.
//
// Based on GNOME Shell's ui/dash.js (GPL-2.0-or-later, Copyright GNOME
// Shell contributors). Modified to support click/semantics ported from
// the MaterialDock Quickshell dock, hover magnification, and per-window
// indicators.

import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Graphene from 'gi://Graphene';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as AppDisplay from 'resource:///org/gnome/shell/ui/appDisplay.js';
import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as DND from 'resource:///org/gnome/shell/ui/dnd.js';
import {Dash} from 'resource:///org/gnome/shell/ui/dash.js';

export const DOCK_ANIMATION_TIME = 200;
const LABEL_SHOW_TIME = 150;
const LABEL_HIDE_TIME = 100;
const LABEL_HOVER_TIMEOUT = 300;

export const ClickAction = Object.freeze({
    FOCUS: 'focus',
    FOCUS_OR_MINIMIZE: 'focus-or-minimize',
    TOGGLE_MINIMIZE: 'toggle-minimize',
    CYCLE_WINDOWS: 'cycle-windows',
    PREVIEWS: 'previews',
    LAUNCH: 'launch',
});

export const ScrollAction = Object.freeze({
    CYCLE_WINDOWS: 'cycle-windows',
    SWITCH_WORKSPACE: 'switch-workspace',
    NOTHING: 'nothing',
});

export const MaterialDashItemContainer = GObject.registerClass(
class MaterialDashItemContainer extends St.Widget {
    _init() {
        super._init({
            style_class: 'dash-item-container',
            pivot_point: new Graphene.Point({x: 0.5, y: 0.5}),
            layout_manager: new Clutter.BoxLayout({
                orientation: Clutter.Orientation.VERTICAL,
                spacing: 2,
            }),
            scale_x: 0,
            scale_y: 0,
            opacity: 0,
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });

        this._labelText = '';
        this.label = new St.Label({style_class: 'dash-label'});
        this.label.hide();
        Main.layoutManager.addChrome(this.label);

        this.child = null;
        this.animatingOut = false;

        this.connect('notify::scale-x', () => this.queue_relayout());
        this.connect('notify::scale-y', () => this.queue_relayout());

        this.connect('destroy', () => {
            if (this.child != null)
                this.child.destroy();
            this.label?.destroy();
        });
    }

    vfunc_get_preferred_height(forWidth) {
        const themeNode = this.get_theme_node();
        forWidth = themeNode.adjust_for_width(forWidth);
        const [minHeight, natHeight] = super.vfunc_get_preferred_height(forWidth);
        return themeNode.adjust_preferred_height(
            minHeight * this.scale_y,
            natHeight * this.scale_y);
    }

    vfunc_get_preferred_width(forHeight) {
        const themeNode = this.get_theme_node();
        forHeight = themeNode.adjust_for_height(forHeight);
        const [minWidth, natWidth] = super.vfunc_get_preferred_width(forHeight);
        return themeNode.adjust_preferred_width(
            minWidth * this.scale_x,
            natWidth * this.scale_x);
    }

    showLabel() {
        if (!this._labelText)
            return;

        this.label.set_text(this._labelText);
        this.label.opacity = 0;
        this.label.show();

        const [stageX, stageY] = this.get_transformed_position();
        const itemWidth = this.allocation.get_width();
        const labelWidth = this.label.get_width();

        const xOffset = Math.floor((itemWidth - labelWidth) / 2);
        const x = Math.clamp(stageX + xOffset, 0, global.stage.width - labelWidth);

        const node = this.label.get_theme_node();
        const yOffset = node.get_length('-y-offset');
        const y = stageY - this.label.height - yOffset;

        this.label.set_position(x, Math.max(0, y));
        this.label.ease({
            opacity: 255,
            duration: LABEL_SHOW_TIME,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });
    }

    setLabelText(text) {
        this._labelText = text;
        this.child?.set_accessible_name(text);
    }

    hideLabel() {
        this.label.ease({
            opacity: 0,
            duration: LABEL_HIDE_TIME,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => this.label.hide(),
        });
    }

    setChild(actor) {
        if (this.child === actor)
            return;

        this.destroy_all_children();
        this.child = actor;
        this.child.y_expand = true;
        this.add_child(this.child);
    }

    show(animate) {
        if (this.child == null)
            return;

        const time = animate ? DOCK_ANIMATION_TIME : 0;
        this.ease({
            scale_x: 1,
            scale_y: 1,
            opacity: 255,
            duration: time,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });
    }

    animateOutAndDestroy() {
        this.label.hide();

        if (this.child == null) {
            this.destroy();
            return;
        }

        this.animatingOut = true;
        this.ease({
            scale_x: 0,
            scale_y: 0,
            opacity: 0,
            duration: DOCK_ANIMATION_TIME,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => this.destroy(),
        });
    }
});

export const MaterialDashIcon = GObject.registerClass(
class MaterialDashIcon extends AppDisplay.AppIcon {
    _init(app, position) {
        super._init(app, {
            setSizeManually: true,
            showLabel: false,
            popupMenuSide: position === 'top' ? St.Side.BOTTOM : St.Side.TOP,
        });

        this._dock = null;
        this._cycleIndex = 0;
        this._winCount = {};
    }

    scaleAndFade() {
    }

    undoScaleAndFade() {
    }

    handleDragOver() {
        return DND.DragMotionResult.CONTINUE;
    }

    acceptDrop() {
        return false;
    }

    vfunc_scroll_event(event) {
        if (this._dock)
            return this._dock.onAppIconScroll(this, event);
        return Clutter.EVENT_PROPAGATE;
    }

    vfunc_clicked(button) {
        if (this._dock)
            this._dock.onAppIconClick(this, button);
        else
            this.activate(button);
    }

    getInterestingWindows() {
        const windows = this.app.get_windows().filter(w => !w.skip_taskbar);
        const activeWs = global.workspace_manager.get_active_workspace();
        // Prioritize windows on the active workspace.
        const onWorkspace = windows.filter(w => w.workspace === activeWs);
        return onWorkspace.length > 0 ? onWorkspace : windows;
    }

    isFocused() {
        const tracker = Shell.WindowTracker.get_default();
        return tracker.focusApp === this.app;
    }
});

export const MaterialDash = GObject.registerClass(
class MaterialDash extends Dash {
    _init(dockOwner, settings) {
        super._init();

        this._dock = dockOwner;
        this._settings = settings;
        this._position = settings.get_string('dock-position');
        this._onSettings();

        // We provide our own card in MaterialDock, silence the internal dash
        // background so icons render cleanly on our own surface.
        this._background.hide();

        this._settings.connectObject(
            'changed::dock-position', () => this._onPositionChanged(),
            this);
        this.connect('destroy', () => {
            if (this._settings)
                this._settings.disconnectObject(this);
        });

        this._dashContainer.x_align = Clutter.ActorAlign.CENTER;
        this._dashContainer.y_expand = true;

        // App icons carry their indicator below, so their textures sit at the
        // top of the item container. Align the app-grid button to the same
        // baseline and leave a visible gap between it and the last app icon.
        this._showAppsIcon.y_align = Clutter.ActorAlign.START;
        this._dashContainer.spacing = Math.max(8, Math.round(this.iconSize / 3));
    }

    _onPositionChanged() {
        this._position = this._settings.get_string('dock-position');
        // Rebuild items so popup menus open on the correct side.
        this.queueRedisplay();
    }

    _onSettings() {
        this._iconSize = this._settings.get_int('icon-size');
        this.setIconSize(this._iconSize);

        const showFavorites = this._settings.get_boolean('show-favorites');
        const showRunning = this._settings.get_boolean('show-running');

        this._showFavorites = showFavorites;
        this._showRunning = showRunning;

        const showApps = this._settings.get_boolean('show-show-apps-button');
        if (showApps)
            this.showAppsButton.show();
        else
            this.showAppsButton.hide();

        this.queueRedisplay();
    }

    onSettingsChanged() {
        this._onSettings();
    }

    setIconSize(size) {
        if (this.iconSize === size)
            return;

        this.iconSize = size;
        this._showAppsIcon?.icon.setIconSize(size);
        const box = this._box;
        if (!box) return;
        for (const child of box.get_children()) {
            const icon = child.child?._delegate?.icon;
            if (icon) icon.setIconSize(size);
        }
    }

    queueRedisplay() {
        this._queueRedisplay();
    }

    resetAppIcons() {
        this.queueRedisplay();
    }

    // Filter favorites/running per settings.
    _redisplay() {
        const favorites = AppFavorites.getAppFavorites().getFavoriteMap();
        const running = this._appSystem.get_running().filter(app => this._showRunning);

        // Rebuild the favorites list honoring show-favorites.
        const visibleFavorites = this._showFavorites ? favorites : {};

        const children = this._box.get_children().filter(actor =>
            actor.child?._delegate?.app);
        const oldApps = children.map(actor => actor.child._delegate.app);
        const newApps = [];

        for (const id in visibleFavorites)
            newApps.push(visibleFavorites[id]);
        for (const app of running) {
            if (app.get_id() in visibleFavorites)
                continue;
            newApps.push(app);
        }

        const addedItems = [];
        const removedActors = [];

        let newIndex = 0;
        let oldIndex = 0;
        while (newIndex < newApps.length || oldIndex < oldApps.length) {
            const oldApp = oldApps.length > oldIndex ? oldApps[oldIndex] : null;
            const newApp = newApps.length > newIndex ? newApps[newIndex] : null;

            if (oldApp === newApp) {
                oldIndex++;
                newIndex++;
                continue;
            }

            if (oldApp && !newApps.includes(oldApp)) {
                removedActors.push(children[oldIndex]);
                oldIndex++;
                continue;
            }

            if (newApp && !oldApps.includes(newApp)) {
                addedItems.push({
                    app: newApp,
                    item: this._createAppItem(newApp),
                    pos: newIndex,
                });
                newIndex++;
                continue;
            }

            const nextApp = newApps.length > newIndex + 1
                ? newApps[newIndex + 1]
                : null;
            const insertHere = nextApp && nextApp === oldApp;
            const alreadyRemoved = removedActors.reduce((result, actor) =>
                result || actor.child._delegate.app === newApp, false);

            if (insertHere || alreadyRemoved) {
                const newItem = this._createAppItem(newApp);
                addedItems.push({
                    app: newApp,
                    item: newItem,
                    pos: newIndex + removedActors.length,
                });
                newIndex++;
            } else {
                removedActors.push(children[oldIndex]);
                oldIndex++;
            }
        }

        for (const {item, pos} of addedItems)
            this._box.insert_child_at_index(item, pos);

        for (const actor of removedActors) {
            if (Main.overview.visible && !Main.overview.animationInProgress)
                actor.animateOutAndDestroy();
            else
                actor.destroy();
        }

        // Update separator between favorites and running.
        const nFavorites = this._showFavorites ? Object.keys(favorites).length : 0;
        if (nFavorites > 0 && nFavorites < newApps.length) {
            if (!this._separator) {
                this._separator = new St.Widget({
                    style_class: 'dash-separator',
                    y_align: Clutter.ActorAlign.CENTER,
                    height: this.iconSize,
                });
                this._box.add_child(this._separator);
            }
            let pos = nFavorites;
            let itemsBeforeSeparator = 0;
            for (const item of this._box.get_children()) {
                if (item.animatingOut)
                    pos++;
                itemsBeforeSeparator++;
                if (itemsBeforeSeparator > nFavorites)
                    break;
            }
            if (this._dragPlaceholder)
                pos++;
            this._box.set_child_at_index(this._separator, pos);
        } else if (this._separator) {
            this._separator.destroy();
            this._separator = null;
        }

        this._adjustIconSize();

        const animate = this._shownInitially && Main.overview.visible &&
            !Main.overview.animationInProgress;
        if (!this._shownInitially)
            this._shownInitially = true;

        for (const {item} of addedItems)
            item.show(animate);

        this._box.queue_relayout();
    }

    _createAppItem(app) {
        const item = new MaterialDashItemContainer();
        const appIcon = new MaterialDashIcon(app, this._position);
        appIcon._dock = this._dock;
        appIcon._settings = this._settings;

        appIcon.connect('menu-state-changed', (_o, opened) => {
            this._itemMenuStateChanged(item, opened);
        });

        item.setChild(appIcon);

        appIcon.label_actor = null;
        item.setLabelText(app.get_name());

        appIcon.icon.setIconSize(this.iconSize);
        this._hookUpLabel(item, appIcon);

        if (this._dock)
            this._dock.onAppItemCreated(item, app);

        return item;
    }

    // The dock hosts the dash. Expose a convenient getter for the actual
    // icon children.
    get _items() {
        return this._box.get_children().filter(c => c.child);
    }
});