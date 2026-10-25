import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {ICON_SIZES} from './constants.js';

const AUTOHIDE_MODES = [
    ['never', 'Never hide'],
    ['always', 'Auto hide'],
    ['intelligent', 'Intelligent'],
];

const POSITIONS = [
    ['bottom', 'Bottom'],
    ['top', 'Top'],
];

const ALIGNMENTS = [
    ['start', 'Start'],
    ['center', 'Center'],
    ['end', 'End'],
];

export class DockContextMenu {
    constructor(dock) {
        this._dock = dock;
        this._settings = dock.settings;
        this._menu = null;
        this._menuManager = new PopupMenu.PopupMenuManager(dock);
        this._openPreferences = null;
        this._peekedWindows = new Set();
    }

    setOnOpenPreferences(cb) {
        this._openPreferences = cb;
    }

    popup() {
        this.close();
        const menu = new PopupMenu.PopupMenu(this._dock, 0.5,
            this._dock._dockPosition === 'top' ? St.Side.TOP : St.Side.BOTTOM);
        this._menu = menu;
        menu.blockSourceEvents = false;
        Main.uiGroup.add_child(menu.actor);
        this._menuManager.addMenu(menu);

        menu.connect('open-state-changed', (_m, open) => {
            if (!open && this._menu === menu) {
                this._menu = null;
                this._dock._contextMenuOpen = false;
                menu.destroy();
            }
        });

        const settingsItem = new PopupMenu.PopupMenuItem('Dock Settings…');
        settingsItem.connect('activate', () => {
            this._openPreferences?.();
            this._dock._contextMenuOpen = false;
        });
        menu.addMenuItem(settingsItem);
        const showDesktopItem = new PopupMenu.PopupMenuItem('Show Desktop / Restore Windows');
        showDesktopItem.connect('activate', () => this.toggleShowDesktop());
        menu.addMenuItem(showDesktopItem);
        menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        menu.addMenuItem(this._buildModeItem());
        menu.addMenuItem(this._buildPositionItem());
        menu.addMenuItem(this._buildAlignmentItem());
        menu.addMenuItem(this._buildIconSizeItem());
        menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        menu.addMenuItem(this._buildMagnifyItem());

        menu.open();
        this._dock._contextMenuOpen = true;
    }

    toggleShowDesktop() {
        // Toggle only windows on the primary monitor; keep the exact window
        // objects so restoring does not accidentally unminimize unrelated apps.
        if (this._peekedWindows.size > 0) {
            for (const win of this._peekedWindows) {
                try {
                    if (win.get_compositor_private() && win.minimized)
                        win.unminimize();
                } catch {}
            }
            this._peekedWindows.clear();
            return;
        }

        const primaryIndex = Main.layoutManager.primaryIndex;
        for (const actor of global.get_window_actors()) {
            const win = actor.metaWindow;
            if (!win || !win.get_compositor_private() || win.skip_taskbar ||
                win.minimized || win.get_monitor() !== primaryIndex)
                continue;

            this._peekedWindows.add(win);
            win.minimize();
        }
    }

    _buildModeItem() {
        const section = new PopupMenu.PopupSubMenuMenuItem('Autohide mode');
        section.connect('open-state-changed', (_s, open) => {
            if (open) {
                section.label.set_text(
                    `Autohide mode: ${this._currentLabel(AUTOHIDE_MODES, 'autohide-mode')}`);
                section.menu.getMenuItems().forEach(item => {
                    item.setOrnament(item._autohideValue === this._settings.get_string('autohide-mode')
                        ? PopupMenu.Ornament.CHECK : PopupMenu.Ornament.NONE);
                });
            }
        });
        for (const [value, label] of AUTOHIDE_MODES) {
            const item = new PopupMenu.PopupMenuItem(label);
            item._autohideValue = value;
            item.connect('activate', () => {
                this._settings.set_string('autohide-mode', value);
                section.label.set_text(`Autohide mode: ${label}`);
                section.setSubmenuShown(false);
            });
            section.menu.addMenuItem(item);
        }
        section.label.set_text(`Autohide mode: ${this._currentLabel(AUTOHIDE_MODES, 'autohide-mode')}`);
        return section;
    }

    _buildPositionItem() {
        const section = new PopupMenu.PopupSubMenuMenuItem('Dock position');
        section.connect('open-state-changed', (_s, open) => {
            if (open)
                section.label.set_text(`Position: ${this._currentLabel(POSITIONS, 'dock-position')}`);
        });
        for (const [value, label] of POSITIONS) {
            const item = new PopupMenu.PopupMenuItem(label);
            item.connect('activate', () => {
                this._settings.set_string('dock-position', value);
                section.label.set_text(`Position: ${label}`);
                section.setSubmenuShown(false);
            });
            section.menu.addMenuItem(item);
        }
        section.label.set_text(`Position: ${this._currentLabel(POSITIONS, 'dock-position')}`);
        return section;
    }

    _buildAlignmentItem() {
        const section = new PopupMenu.PopupSubMenuMenuItem('Dock alignment');
        section.connect('open-state-changed', (_s, open) => {
            if (open)
                section.label.set_text(`Alignment: ${this._currentLabel(ALIGNMENTS, 'dock-alignment')}`);
        });
        for (const [value, label] of ALIGNMENTS) {
            const item = new PopupMenu.PopupMenuItem(label);
            item.connect('activate', () => {
                this._settings.set_string('dock-alignment', value);
                section.label.set_text(`Alignment: ${label}`);
                section.setSubmenuShown(false);
            });
            section.menu.addMenuItem(item);
        }
        section.label.set_text(`Alignment: ${this._currentLabel(ALIGNMENTS, 'dock-alignment')}`);
        return section;
    }

    _buildIconSizeItem() {
        const section = new PopupMenu.PopupSubMenuMenuItem('Icon size');
        section.connect('open-state-changed', (_s, open) => {
            if (open)
                section.label.set_text(`Icon size: ${this._settings.get_int('icon-size')}px`);
        });
        for (const size of ICON_SIZES) {
            const item = new PopupMenu.PopupMenuItem(`${size}px`);
            item.connect('activate', () => {
                this._settings.set_int('icon-size', size);
                section.label.set_text(`Icon size: ${size}px`);
                section.setSubmenuShown(false);
            });
            section.menu.addMenuItem(item);
        }
        section.label.set_text(`Icon size: ${this._settings.get_int('icon-size')}px`);
        return section;
    }

    _buildMagnifyItem() {
        const item = new PopupMenu.PopupSwitchMenuItem('Magnification',
            this._settings.get_boolean('magnify-enabled'));
        item.connect('toggled', (_s, state) => {
            this._settings.set_boolean('magnify-enabled', state);
        });
        return item;
    }

    _currentLabel(options, key) {
        const value = this._settings.get_string(key);
        const found = options.find(([v]) => v === value);
        return found?.[1] ?? '—';
    }

    close() {
        const menu = this._menu;
        this._menu = null;
        this._dock._contextMenuOpen = false;

        if (menu) {
            menu.close();
            menu.destroy();
        }
    }

    destroy() {
        this.close();
    }
}