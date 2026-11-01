import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {formatRelativeTime, formatSize} from './utils.js';
import {sortFolderEntries} from './folder-sort.js';
import {collectFolderBatch} from './folder-enumeration.js';
import {runGroupAction} from './group-actions.js';
import {formatFolderCount} from './folder-count.js';

const MAX_FILES = 14;
const MAX_SCAN_ENTRIES = 500;

function closeEnumerator(enumerator) {
    if (!enumerator) return;
    try {
        enumerator.close_async(GLib.PRIORITY_DEFAULT, null, (source, result) => {
            try {
                source.close_finish(result);
            } catch {}
        });
    } catch {}
}

function expandHomePath(path) {
    if (path === '~') return GLib.get_home_dir();
    if (path.startsWith('~/')) return `${GLib.get_home_dir()}/${path.slice(2)}`;
    return path;
}

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
        // GridLayout positions children through attach(), not actor x/y.
        grid.layout_manager.attach(icon, col, row, 1, 1);
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
            this._menuManager = new PopupMenu.PopupMenuManager(this);
        }
    },
);

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
    },
);

export const FolderTile = GObject.registerClass(
    class FolderTile extends TileButton {
        _init(dock, folderPath) {
            super._init(dock);
            this._folderPath = expandHomePath(folderPath);

            const name = folderPath.split('/').filter(Boolean).pop() || folderPath;
            const label = new St.Label({
                text: String(name).slice(0, 16),
                style_class: 'material-dock-tile-label',
            });
            const icon = new St.Icon({
                icon_name: 'folder-symbolic',
                icon_size: dock.iconSize - 6,
            });
            const box = new St.BoxLayout({
                orientation: Clutter.Orientation.VERTICAL,
                x_align: Clutter.ActorAlign.CENTER,
            });
            box.add_child(icon);
            box.add_child(label);
            this._countLabel = new St.Label({
                text: '',
                style_class: 'material-dock-folder-count',
                visible: false,
            });
            box.add_child(this._countLabel);
            this.child = box;

            this._countMonitor = null;
            this._countCancellable = null;
            this._countRefreshSource = 0;
            this._countSettingsId = dock.settings.connect(
                'changed::show-folder-counts',
                () => this._updateCountSetting(),
            );
            this.connect('destroy', () => {
                if (this._countRefreshSource) {
                    GLib.source_remove(this._countRefreshSource);
                    this._countRefreshSource = 0;
                }
                this._countCancellable?.cancel();
                this._countMonitor?.cancel();
                this._countMonitor = null;
                if (this._countSettingsId) {
                    dock.settings.disconnect(this._countSettingsId);
                    this._countSettingsId = 0;
                }
            });
            this._updateCountSetting();

            this.connect('clicked', () => this._openPopover());
        }

        _updateCountSetting() {
            const enabled = this._dock.settings.get_boolean('show-folder-counts');
            this._countLabel.visible = enabled;
            if (!enabled) {
                this._countCancellable?.cancel();
                this._countCancellable = null;
                this._countMonitor?.cancel();
                this._countMonitor = null;
                if (this._countRefreshSource) {
                    GLib.source_remove(this._countRefreshSource);
                    this._countRefreshSource = 0;
                }
                return;
            }
            if (!this._countMonitor) {
                try {
                    this._countMonitor = Gio.File.new_for_path(this._folderPath).monitor_directory(
                        Gio.FileMonitorFlags.WATCH_MOVES,
                        null,
                    );
                    this._countMonitor.connect('changed', () => {
                        if (this._countRefreshSource) {
                            GLib.source_remove(this._countRefreshSource);
                        }
                        this._countRefreshSource = GLib.timeout_add(
                            GLib.PRIORITY_DEFAULT,
                            200,
                            () => {
                                this._countRefreshSource = 0;
                                this._refreshCount();
                                return GLib.SOURCE_REMOVE;
                            },
                        );
                    });
                } catch {
                    this._countLabel.set_text('—');
                    return;
                }
            }
            this._refreshCount();
        }

        _refreshCount() {
            this._countCancellable?.cancel();
            const cancellable = new Gio.Cancellable();
            this._countCancellable = cancellable;
            Gio.File.new_for_path(this._folderPath).enumerate_children_async(
                'standard::type,standard::is-hidden',
                Gio.FileQueryInfoFlags.NONE,
                GLib.PRIORITY_DEFAULT,
                cancellable,
                (source, result) => {
                    let enumerator;
                    try {
                        enumerator = source.enumerate_children_finish(result);
                    } catch {
                        if (this._countCancellable === cancellable && !cancellable.is_cancelled()) {
                            this._countLabel.set_text('—');
                        }
                        return;
                    }
                    const entries = [];
                    let scanned = 0;
                    const finish = partial => {
                        if (this._countCancellable !== cancellable || cancellable.is_cancelled()) {
                            closeEnumerator(enumerator);
                            return;
                        }
                        this._countLabel.set_text(formatFolderCount(entries.length, partial));
                        closeEnumerator(enumerator);
                    };
                    const readBatch = () => {
                        if (cancellable.is_cancelled()) {
                            closeEnumerator(enumerator);
                            return;
                        }
                        enumerator.next_files_async(
                            Math.min(64, MAX_SCAN_ENTRIES - scanned + 1),
                            GLib.PRIORITY_DEFAULT,
                            cancellable,
                            (current, batchResult) => {
                                let batch;
                                try {
                                    batch = current.next_files_finish(batchResult);
                                } catch {
                                    finish(false);
                                    return;
                                }
                                const resultBatch = collectFolderBatch(
                                    entries,
                                    batch,
                                    MAX_SCAN_ENTRIES - scanned,
                                    info =>
                                        info.get_file_type() !== Gio.FileType.DIRECTORY &&
                                        !info.get_is_hidden(),
                                );
                                scanned += resultBatch.scanned;
                                if (resultBatch.truncated) {
                                    finish(true);
                                } else if (batch.length > 0) {
                                    readBatch();
                                } else {
                                    finish(false);
                                }
                            },
                        );
                    };
                    readBatch();
                },
            );
        }

        _openPopover() {
            const dock = this._dock;
            dock.closeActivePopover();

            const popover = new PopupMenu.PopupMenu(
                this,
                0.5,
                this._dock._dockPosition === 'top' ? St.Side.TOP : St.Side.BOTTOM,
            );
            popover.blockSourceEvents = false;
            Main.uiGroup.add_child(popover.actor);
            this._menuManager.addMenu(popover);

            const header = new PopupMenu.PopupMenuSection();
            const title = new PopupMenu.PopupMenuItem(this._folderPath, {reactive: false});
            title.add_style_pseudo_class('disabled');
            header.addMenuItem(title);

            const openInFiles = new PopupMenu.PopupMenuItem('Open in Files');
            openInFiles.connect('activate', () => {
                Gio.AppInfo.launch_default_for_uri(
                    Gio.File.new_for_path(this._folderPath).get_uri(),
                    null,
                );
            });
            header.addMenuItem(openInFiles);

            const refresh = new PopupMenu.PopupMenuItem('Refresh');
            refresh.connect('activate', () => this._openPopover());
            header.addMenuItem(refresh);
            header.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            popover.addMenuItem(header);
            const listSection = new PopupMenu.PopupMenuSection();
            popover.addMenuItem(listSection);

            this._dock._activePopover = popover;
            const cancellable = new Gio.Cancellable();
            popover.connect('open-state-changed', (_m, open) => {
                if (!open) {
                    cancellable.cancel();
                    if (this._dock._activePopover === popover) this._dock._activePopover = null;
                    popover.destroy();
                }
            });

            popover.open();

            const file = Gio.File.new_for_path(this._folderPath);
            file.enumerate_children_async(
                'standard::name,standard::size,standard::type,standard::content-type,standard::is-hidden,standard::icon,time::modified',
                Gio.FileQueryInfoFlags.NONE,
                GLib.PRIORITY_DEFAULT,
                cancellable,
                (src, res) => {
                    let enumerator;
                    try {
                        enumerator = src.enumerate_children_finish(res);
                    } catch (e) {
                        if (!cancellable.is_cancelled()) {
                            listSection.addMenuItem(
                                new PopupMenu.PopupMenuItem(
                                    'Folder unavailable or unreadable. Check its path and permissions.',
                                    {
                                        reactive: false,
                                    },
                                ),
                            );
                        }
                        return;
                    }

                    if (cancellable.is_cancelled()) {
                        closeEnumerator(enumerator);
                        return;
                    }

                    const infos = [];
                    let scannedEntries = 0;

                    const showEntries = partial => {
                        const sortMode = this._dock.settings.get_string('folder-sort');
                        const sortedInfos = sortFolderEntries(infos, sortMode, {
                            getName: info => info.get_name(),
                            getModified: info =>
                                Number(info.get_attribute_uint64('time::modified')),
                            getType: info => {
                                const contentType =
                                    info.get_content_type() || 'application/octet-stream';
                                return Gio.content_type_get_description(contentType);
                            },
                        });

                        sortedInfos.slice(0, MAX_FILES).forEach(fi => {
                            const item = new FileStackItem(fi, this._folderPath);
                            item.connect('activate', () => {
                                const uri = Gio.File.new_for_path(
                                    this._folderPath + '/' + fi.get_name(),
                                ).get_uri();
                                Gio.AppInfo.launch_default_for_uri(uri, null);
                                popover.close();
                            });
                            listSection.addMenuItem(item);
                        });

                        if (partial) {
                            listSection.addMenuItem(
                                new PopupMenu.PopupMenuItem(
                                    `Partial results: scanned only the first ${MAX_SCAN_ENTRIES} folder entries.`,
                                    {reactive: false},
                                ),
                            );
                        } else if (infos.length > MAX_FILES) {
                            const more = new PopupMenu.PopupMenuItem(
                                `+ ${infos.length - MAX_FILES} more`,
                                {reactive: false},
                            );
                            listSection.addMenuItem(more);
                        } else if (infos.length === 0) {
                            listSection.addMenuItem(
                                new PopupMenu.PopupMenuItem('Folder is empty', {
                                    reactive: false,
                                }),
                            );
                        }
                        closeEnumerator(enumerator);
                    };

                    const readNextBatch = () => {
                        if (cancellable.is_cancelled()) {
                            closeEnumerator(enumerator);
                            return;
                        }

                        // Read at most one entry beyond the remaining scan budget so
                        // truncation can be detected without fetching another full batch.
                        const batchSize = Math.min(64, MAX_SCAN_ENTRIES - scannedEntries + 1);
                        enumerator.next_files_async(
                            batchSize,
                            GLib.PRIORITY_DEFAULT,
                            cancellable,
                            (source, result) => {
                                let batch;
                                try {
                                    batch = source.next_files_finish(result);
                                } catch (e) {
                                    if (!cancellable.is_cancelled()) {
                                        listSection.addMenuItem(
                                            new PopupMenu.PopupMenuItem(
                                                'Folder unavailable or unreadable. Check its path and permissions.',
                                                {
                                                    reactive: false,
                                                },
                                            ),
                                        );
                                    }
                                    closeEnumerator(enumerator);
                                    return;
                                }

                                if (cancellable.is_cancelled()) {
                                    closeEnumerator(enumerator);
                                    return;
                                }

                                const resultBatch = collectFolderBatch(
                                    infos,
                                    batch,
                                    MAX_SCAN_ENTRIES - scannedEntries,
                                    info =>
                                        info.get_file_type() !== Gio.FileType.DIRECTORY &&
                                        !info.get_is_hidden(),
                                );
                                scannedEntries += resultBatch.scanned;

                                if (resultBatch.truncated) {
                                    showEntries(true);
                                    return;
                                }

                                if (batch.length > 0) {
                                    readNextBatch();
                                    return;
                                }

                                showEntries(false);
                            },
                        );
                    };
                    readNextBatch();
                },
            );
        }
    },
);

const FileStackItem = GObject.registerClass(
    class FileStackItem extends PopupMenu.PopupBaseMenuItem {
        _init(fileInfo, folderPath) {
            super._init({activate: true});
            this._fileInfo = fileInfo;
            this._folderPath = folderPath;

            const name = fileInfo.get_name();
            const size = fileInfo.get_size();
            const mtime = Number(fileInfo.get_attribute_uint64('time::modified'));

            this._icon = new St.Icon({
                gicon: fileInfo.get_icon(),
                icon_size: 22,
            });
            this.add_child(this._icon);

            const vbox = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL});
            const nameLabel = new St.Label({
                text: name.slice(0, 40),
                style_class: 'material-dock-file-name',
            });
            nameLabel.clutter_text.ellipsize = Pango.EllipsizeMode.END;
            const subLabel = new St.Label({
                text: `${formatSize(size)}  ·  ${formatRelativeTime(mtime)}`,
                style_class: 'material-dock-file-sub',
            });
            vbox.add_child(nameLabel);
            vbox.add_child(subLabel);
            this.add_child(vbox);
        }
    },
);

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
            const box = new St.BoxLayout({
                orientation: Clutter.Orientation.VERTICAL,
                x_align: Clutter.ActorAlign.CENTER,
            });
            box.add_child(icon);
            box.add_child(label);
            this.child = box;

            this.connect('clicked', () => this._openPopover());
        }

        _openPopover() {
            const dock = this._dock;
            dock.closeActivePopover();

            const popover = new PopupMenu.PopupMenu(
                this,
                0.5,
                this._dock._dockPosition === 'top' ? St.Side.TOP : St.Side.BOTTOM,
            );
            popover.blockSourceEvents = false;
            Main.uiGroup.add_child(popover.actor);
            this._menuManager.addMenu(popover);

            const header = new PopupMenu.PopupMenuSection();
            const title = new PopupMenu.PopupMenuItem(this._label, {reactive: false});
            title.add_style_pseudo_class('disabled');
            header.addMenuItem(title);
            header.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            popover.addMenuItem(header);

            const listSection = new PopupMenu.PopupMenuSection();
            popover.addMenuItem(listSection);

            this._dock._activePopover = popover;
            popover.connect('open-state-changed', (_m, open) => {
                if (!open) {
                    if (this._dock._activePopover === popover) this._dock._activePopover = null;
                    popover.destroy();
                }
            });

            const uniqueIds = [...new Set(this._appIds)];
            const apps = uniqueIds.map(id => this._appSystem.lookup_app(id)).filter(Boolean);
            const invalidCount = uniqueIds.length - apps.length;

            if (apps.length > 0) {
                const actionSection = new PopupMenu.PopupMenuSection();
                const launchAll = new PopupMenu.PopupMenuItem('Launch all');
                launchAll.connect('activate', () => {
                    const result = runGroupAction(apps, app => app.activate());
                    const failed = result.failed + invalidCount;
                    Main.notify(
                        'Material Dock',
                        failed > 0
                            ? `Launched ${result.completed} apps; ${failed} could not be launched.`
                            : `Launched ${result.completed} apps.`,
                    );
                    popover.close();
                });
                actionSection.addMenuItem(launchAll);

                const minimizeAll = new PopupMenu.PopupMenuItem('Minimize all');
                minimizeAll.connect('activate', () => {
                    const windows = [];
                    let collectionFailures = 0;
                    for (const app of apps) {
                        try {
                            windows.push(
                                ...app
                                    .get_windows()
                                    .filter(window => !window.skip_taskbar && !window.minimized),
                            );
                        } catch {
                            collectionFailures++;
                        }
                    }

                    const result = runGroupAction(windows, window => window.minimize());
                    const failed = result.failed + collectionFailures + invalidCount;
                    if (windows.length === 0 && failed === 0) {
                        Main.notify('Material Dock', 'No running windows to minimize.');
                    } else {
                        Main.notify(
                            'Material Dock',
                            failed > 0
                                ? `Minimized ${result.completed} windows; ${failed} could not be minimized.`
                                : `Minimized ${result.completed} windows.`,
                        );
                    }
                    popover.close();
                });
                actionSection.addMenuItem(minimizeAll);
                popover.addMenuItem(actionSection);
            }

            if (apps.length === 0) {
                listSection.addMenuItem(
                    new PopupMenu.PopupMenuItem('No apps found', {reactive: false}),
                );
            } else {
                for (const app of apps) {
                    const item = new MenuAppItem(app.get_name(), app.create_icon_texture(22));
                    item.connect('activate', () => {
                        app.activate();
                        popover.close();
                    });
                    listSection.addMenuItem(item);
                }
            }

            popover.open();
        }
    },
);

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
            this.refresh(
                dock.settings.get_strv('folder-stacks'),
                dock.settings.get_strv('app-groups'),
            );
        }

        refresh(folderStacks, appGroups) {
            this._tiles.forEach(t => t.destroy());
            this._tiles = [];

            for (const path of folderStacks) this._tiles.push(new FolderTile(this._dock, path));

            for (const entry of appGroups) {
                const [label, ids] = entry.split('|');
                if (!label || !ids) continue;
                const group = {label, appIds: ids.split(',').filter(Boolean)};
                if (group.appIds.length > 0) this._tiles.push(new GroupTile(this._dock, group));
            }

            this._tiles.forEach(t => this.add_child(t));
            this.visible = this._tiles.length > 0;
        }
    },
);
