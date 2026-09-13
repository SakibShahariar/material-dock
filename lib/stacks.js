import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';
import Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {formatRelativeTime, formatSize} from './utils.js';

const MAX_FILES = 14;

function buildAppIconGrid(appIds, iconSize, appSystem) {
    const ids = appIds.slice(0, 4);
    const grid = new St.Widget({
        layout_manager: new Clutter.GridLayout({row_spacing: 1, column_spacing: 1}),
        width: iconSize,
        height: iconSize,
    });
    const cols = Math.min(ids.length, 2);
    let row = 0;
    let col = 0;
    ids.forEach((id, i) => {
        const app = appSystem.lookup_app(id);
        const icon = app
            ? app.create_icon_texture(Math.floor(iconSize / cols) - 2)
            : new St.Icon({icon_name: 'image-missing', icon_size: Math.floor(iconSize / cols)});
        icon.x = col * Math.floor(iconSize / cols);
        icon.y = row * Math.floor(iconSize / cols);
        grid.add_child(icon);
        col++;
        if (col >= cols) {
            col = 0;
            row++;
        }
    });
    return grid;
}

const TileButton = GObject.registerClass(
class TileButton extends St.Button {
    _init(dock, params) {
        super._init({
            style_class: 'material-dock-tile',
            track_hover: true,
            reactive: true,
            can_focus: true,
            ...params,
        });
        this._dock = dock;
    }
});

const MenuAppItem = GObject.registerClass(
class MenuAppItem extends PopupMenu.PopupBaseMenuItem {
    _init(label, icon) {
        super._init({activate: true});
        if (icon) {
            this.add_child(icon);
        } else {
            const placeholder = new St.Icon({
                icon_name: 'image-missing',
                style_class: 'popup-menu-icon',
                icon_size: 22,
            });
            this.add_child(placeholder);
        }
        this.label = new St.Label({text: label});
        this.add_child(this.label);
        this.label_actor = this.label;
    }
});

export const FolderTile = GObject.registerClass(
class FolderTile extends TileButton {
    _init(dock, folderPath) {
        super._init(dock);
        this._folderPath = folderPath;

        const name = folderPath.split('/').filter(Boolean).pop() || folderPath;
        const label = new St.Label({
            text: String(name).slice(0, 16),
            style_class: 'material-dock-tile-label',
        });
        const icon = new St.Icon({
            icon_name: 'folder-symbolic',
            icon_size: dock.iconSize - 6,
        });
        const box = new St.BoxLayout({vertical: true, x_align: Clutter.ActorAlign.CENTER});
        box.add_child(icon);
        box.add_child(label);
        this.child = box;

        this.connect('clicked', () => this._openPopover());
    }

    _openPopover() {
        const dock = this._dock;
        dock.closeActivePopover();

        const popover = new PopupMenu.PopupMenu(this, 0.5, St.Side.TOP);
        popover.blockSourceEvents = false;
        Main.uiGroup.add_child(popover.actor);

        const header = new PopupMenu.PopupMenuSection();
        const title = new PopupMenu.PopupMenuItem(this._folderPath, {reactive: false});
        title.actor.add_style_pseudo_class('disabled');
        header.addMenuItem(title);

        const openInFiles = new PopupMenu.PopupMenuItem('Open in Files');
        openInFiles.connect('activate', () => {
            Gio.AppInfo.launch_default_for_uri(
                Gio.File.new_for_path(this._folderPath).get_uri(), null);
        });
        header.addMenuItem(openInFiles);
        header.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        popover.addMenuItem(header);
        const listSection = new PopupMenu.PopupMenuSection();
        popover.addMenuItem(listSection);

        this._dock._activePopover = popover;
        popover.connect('open-state-changed', (_m, open) => {
            if (!open) {
                if (this._dock._activePopover === popover)
                    this._dock._activePopover = null;
                popover.destroy();
            }
        });

        popover.open(Clutter.PointerGrabOp.NONE);

        const cancellable = new Gio.Cancellable();
        const file = Gio.File.new_for_path(this._folderPath);
        file.enumerate_children_async(
            'standard::name,standard::size,standard::type,time::modified',
            Gio.FileQueryInfoFlags.NONE,
            GLib.PRIORITY_DEFAULT,
            cancellable,
            (src, res) => {
                if (cancellable.is_cancelled())
                    return;
                let enumerator;
                try {
                    enumerator = src.enumerate_children_finish(res);
                } catch (e) {
                    listSection.addMenuItem(new PopupMenu.PopupMenuItem('Cannot read folder', {reactive: false}));
                    return;
                }

                let info;
                const infos = [];
                while ((info = enumerator.next_file(null)) !== null) {
                    if (info.get_file_type() === Gio.FileType.DIRECTORY)
                        continue;
                    infos.push(info);
                }
                infos.sort((a, b) => {
                    const ma = a.get_attribute_uint64('time::modified');
                    const mb = b.get_attribute_uint64('time::modified');
                    return mb - ma;
                });

                infos.slice(0, MAX_FILES).forEach(fi => {
                    const item = new FileStackItem(fi, this._folderPath);
                    item.connect('activate', () => {
                        const uri = Gio.File.new_for_path(
                            this._folderPath + '/' + fi.get_name()).get_uri();
                        Gio.AppInfo.launch_default_for_uri(uri, null);
                        popover.close();
                    });
                    listSection.addMenuItem(item);
                });

                if (infos.length > MAX_FILES) {
                    const more = new PopupMenu.PopupMenuItem(
                        `+ ${infos.length - MAX_FILES} more`, {reactive: false});
                    listSection.addMenuItem(more);
                } else if (infos.length === 0) {
                    listSection.addMenuItem(new PopupMenu.PopupMenuItem('Folder is empty', {reactive: false}));
                }
            });
    }
});

const FileStackItem = GObject.registerClass(
class FileStackItem extends PopupMenu.PopupBaseMenuItem {
    _init(fileInfo, folderPath) {
        super._init({activate: true});
        this._fileInfo = fileInfo;
        this._folderPath = folderPath;

        const name = fileInfo.get_name();
        const size = fileInfo.get_size();
        const mtime = fileInfo.get_attribute_uint64('time::modified') / 1000000;

        this._icon = new St.Icon({
            icon_name: 'text-x-generic-symbolic',
            icon_size: 22,
        });
        this.add_child(this._icon);

        const vbox = new St.BoxLayout({vertical: true});
        const nameLabel = new St.Label({
            text: name.slice(0, 40),
            style_class: 'material-dock-file-name',
            ellipsize: 3,
        });
        const subLabel = new St.Label({
            text: `${formatSize(size)}  ·  ${formatRelativeTime(mtime)}`,
            style_class: 'material-dock-file-sub',
        });
        vbox.add_child(nameLabel);
        vbox.add_child(subLabel);
        this.add_child(vbox);
    }
});

export const GroupTile = GObject.registerClass(
class GroupTile extends TileButton {
    _init(dock, group) {
        super._init(dock);
        this._label = group.label;
        this._appIds = group.appIds;
        this._appSystem = Shell.AppSystem.get_default();

        const icon = buildAppIconGrid(this._appIds, dock.iconSize, this._appSystem);
        const label = new St.Label({
            text: String(group.label).slice(0, 16),
            style_class: 'material-dock-tile-label',
        });
        const box = new St.BoxLayout({vertical: true, x_align: Clutter.ActorAlign.CENTER});
        box.add_child(icon);
        box.add_child(label);
        this.child = box;

        this.connect('clicked', () => this._openPopover());
    }

    _openPopover() {
        const dock = this._dock;
        dock.closeActivePopover();

        const popover = new PopupMenu.PopupMenu(this, 0.5, St.Side.TOP);
        popover.blockSourceEvents = false;
        Main.uiGroup.add_child(popover.actor);

        const header = new PopupMenu.PopupMenuSection();
        const title = new PopupMenu.PopupMenuItem(this._label, {reactive: false});
        title.actor.add_style_pseudo_class('disabled');
        header.addMenuItem(title);
        header.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        popover.addMenuItem(header);

        const listSection = new PopupMenu.PopupMenuSection();
        popover.addMenuItem(listSection);

        this._dock._activePopover = popover;
        popover.connect('open-state-changed', (_m, open) => {
            if (!open) {
                if (this._dock._activePopover === popover)
                    this._dock._activePopover = null;
                popover.destroy();
            }
        });

        for (const id of this._appIds) {
            const app = this._appSystem.lookup_app(id);
            if (!app) continue;
            const item = new MenuAppItem(app.get_name(), app.create_icon_texture(22));
            item.connect('activate', () => {
                app.activate();
                popover.close();
            });
            listSection.addMenuItem(item);
        }

        if (listSection._getMenuItems().length === 0)
            listSection.addMenuItem(new PopupMenu.PopupMenuItem('No apps found', {reactive: false}));

        popover.open(Clutter.PointerGrabOp.NONE);
    }
});

export const StacksRow = GObject.registerClass(
class StacksRow extends St.BoxLayout {
    _init(dock) {
        super._init({
            style_class: 'material-dock-stacks',
            reactive: true,
            track_hover: true,
            x_expand: false,
        });
        this._dock = dock;
        this._tiles = [];
        this._refresh(dock.settings.get_strv('folder-stacks'), dock.settings.get_strv('app-groups'));
    }

    refresh(folderStacks, appGroups) {
        this._tiles.forEach(t => t.destroy());
        this._tiles = [];

        for (const path of folderStacks)
            this._tiles.push(new FolderTile(this._dock, path));

        for (const entry of appGroups) {
            const [label, ids] = entry.split('|');
            if (!label || !ids) continue;
            const group = {label, appIds: ids.split(',').filter(Boolean)};
            if (group.appIds.length > 0)
                this._tiles.push(new GroupTile(this._dock, group));
        }

        this._tiles.forEach(t => this.add_child(t));
        this.visible = this._tiles.length > 0;
    }
});