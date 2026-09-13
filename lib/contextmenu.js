import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

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

const ICON_SIZES = [32, 40, 48, 56, 64, 80, 96];

export class DockContextMenu {
    constructor(dock) {
        this._dock = dock;
        this._settings = dock.settings;
        this._menu = null;
        this._openPreferences = null;
    }

    setOnOpenPreferences(cb) {
        this._openPreferences = cb;
    }

    popup() {
        this.close();
        this._menu = new PopupMenu.PopupMenu(this._dock, 0.5, St.Side.TOP);
        this._menu.blockSourceEvents = false;
        Main.uiGroup.add_child(this._menu.actor);

        this._menu.connect('open-state-changed', (_m, open) => {
            if (!open) {
                this._menu = null;
                this._dock._contextMenuOpen = false;
            }
        });

        const settingsItem = new PopupMenu.PopupMenuItem('Dock Settings…');
        settingsItem.connect('activate', () => {
            this._openPreferences?.();
            this._dock._contextMenuOpen = false;
        });
        this._menu.addMenuItem(settingsItem);
        this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._menu.addMenuItem(this._buildModeItem());
        this._menu.addMenuItem(this._buildPositionItem());
        this._menu.addMenuItem(this._buildAlignmentItem());
        this._menu.addMenuItem(this._buildIconSizeItem());
        this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._menu.addMenuItem(this._buildMagnifyItem());

        this._menu.open(Clutter.PointerGrabOp.NONE);
        this._dock._contextMenuOpen = true;
    }

    _buildModeItem() {
        const section = new PopupMenu.PopupSubMenuMenuItem('Autohide mode');
        section.connect('open-state-changed', (_s, open) => {
            if (open) {
                section.menu.getMenuItems().forEach(item => {
                    const value = AUTOHIDE_MODES.find(([, l]) => l === item.label.text)?.[0];
                    item.setOrnament(value === this._settings.get_string('autohide-mode')
                        ? PopupMenu.Ornament.CHECK : PopupMenu.Ornament.NONE);
                });
            }
        });
        for (const [value, label] of AUTOHIDE_MODES) {
            const item = new PopupMenu.PopupMenuItem(label);
            item.connect('activate', () => {
                this._settings.set_string('autohide-mode', value);
                section.setSubmenuShown(false);
            });
            section.menu.addMenuItem(item);
        }
        section.label.set_text(`Autohide mode: ${this._currentLabel(AUTOHIDE_MODES, 'autohide-mode')}`);
        return section;
    }

    _buildPositionItem() {
        const section = new PopupMenu.PopupSubMenuMenuItem('Dock position');
        for (const [value, label] of POSITIONS) {
            const item = new PopupMenu.PopupMenuItem(label);
            item.connect('activate', () => {
                this._settings.set_string('dock-position', value);
                section.setSubmenuShown(false);
            });
            section.menu.addMenuItem(item);
        }
        section.label.set_text(`Position: ${this._currentLabel(POSITIONS, 'dock-position')}`);
        return section;
    }

    _buildAlignmentItem() {
        const section = new PopupMenu.PopupSubMenuMenuItem('Dock alignment');
        for (const [value, label] of ALIGNMENTS) {
            const item = new PopupMenu.PopupMenuItem(label);
            item.connect('activate', () => {
                this._settings.set_string('dock-alignment', value);
                section.setSubmenuShown(false);
            });
            section.menu.addMenuItem(item);
        }
        section.label.set_text(`Alignment: ${this._currentLabel(ALIGNMENTS, 'dock-alignment')}`);
        return section;
    }

    _buildIconSizeItem() {
        const section = new PopupMenu.PopupSubMenuMenuItem('Icon size');
        for (const size of ICON_SIZES) {
            const item = new PopupMenu.PopupMenuItem(`${size}px`);
            item.connect('activate', () => {
                this._settings.set_int('icon-size', size);
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
        if (this._menu) {
            this._menu.close();
            this._menu.destroy();
            this._menu = null;
        }
        this._dock._contextMenuOpen = false;
    }

    destroy() {
        this.close();
    }
}