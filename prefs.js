import Adw from 'gi://Adw?version=1';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';
import GLib from 'gi://GLib';
import {ICON_SIZES} from './lib/constants.js';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const settingsSignalIds = new WeakMap();

function connectSettings(settings, signal, callback) {
    const id = settings.connect(signal, callback);
    let ids = settingsSignalIds.get(settings);
    if (!ids) {
        ids = [];
        settingsSignalIds.set(settings, ids);
    }
    ids.push(id);
    return id;
}

function disconnectSettings(settings) {
    const ids = settingsSignalIds.get(settings) ?? [];
    for (const id of ids)
        settings.disconnect(id);
    settingsSignalIds.delete(settings);
}

function addComboRow(parent, settings, key, title, subtitle, options) {
    const labels = options.map(([label]) => label);
    const model = new Gtk.StringList({strings: labels});
    const row = new Adw.ComboRow({title, subtitle, model});
    parent.add(row);

    const syncFromSettings = () => {
        const value = settings.get_string(key);
        const idx = options.findIndex(([, v]) => v === value);
        row.set_selected(idx < 0 ? 0 : idx);
    };

    row.connect('notify::selected', () => {
        const sel = row.get_selected();
        const value = options[sel]?.[1];
        if (value)
            settings.set_string(key, value);
    });
    connectSettings(settings, `changed::${key}`, syncFromSettings);
    syncFromSettings();
    return row;
}

function addIntComboRow(parent, settings, key, title, subtitle, values) {
    const options = values.map(value => [`${value}px`, value]);
    const model = new Gtk.StringList({strings: options.map(([label]) => label)});
    const row = new Adw.ComboRow({title, subtitle, model});
    parent.add(row);

    const syncFromSettings = () => {
        const value = settings.get_int(key);
        const index = options.findIndex(([, option]) => option === value);
        row.set_selected(index < 0 ? 0 : index);
    };

    row.connect('notify::selected', () => {
        const value = options[row.get_selected()]?.[1];
        if (value !== undefined)
            settings.set_int(key, value);
    });
    connectSettings(settings, `changed::${key}`, syncFromSettings);
    syncFromSettings();
    return row;
}

function addSpinRow(parent, settings, key, title, subtitle, lower, upper, step) {
    const row = new Adw.SpinRow({title, subtitle});
    row.adjustment = new Gtk.Adjustment({lower, upper, step_increment: step, page_increment: 10});
    parent.add(row);

    const syncFromSettings = () => row.set_value(settings.get_double(key));

    row.connect('notify::value', () => settings.set_double(key, row.get_value()));
    connectSettings(settings, `changed::${key}`, syncFromSettings);
    syncFromSettings();
    return row;
}

function addIntSpinRow(parent, settings, key, title, subtitle, lower, upper, step) {
    const row = new Adw.SpinRow({title, subtitle});
    row.adjustment = new Gtk.Adjustment({lower, upper, step_increment: step, page_increment: 10});
    parent.add(row);

    const syncFromSettings = () => row.set_value(settings.get_int(key));

    row.connect('notify::value', () => {
        settings.set_int(key, Math.round(row.get_value()));
    });
    connectSettings(settings, `changed::${key}`, syncFromSettings);
    syncFromSettings();
    return row;
}

function addSwitchRow(parent, settings, key, title, subtitle) {
    const row = new Adw.SwitchRow({title, subtitle});
    parent.add(row);

    const syncFromSettings = () => row.set_active(settings.get_boolean(key));
    row.connect('notify::active', () => settings.set_boolean(key, row.get_active()));
    connectSettings(settings, `changed::${key}`, syncFromSettings);
    syncFromSettings();
    return row;
}

function clearGroupRows(group) {
    // Adw.PreferencesGroup keeps its rows in an internal box, so
    // get_first_child()/remove() loops get stuck on internal widgets.
    // Destroy only the rows we added (ActionRow/EntryRow).
    let child = group.get_first_child();
    while (child) {
        const next = child.get_next_sibling();
        if (child instanceof Adw.ActionRow || child instanceof Adw.EntryRow)
            child.destroy();
        child = next;
    }
}

function makeIconButton(iconName, tooltip, onActivate) {
    const btn = new Gtk.Button({
        icon_name: iconName,
        valign: Gtk.Align.CENTER,
        tooltip_text: tooltip,
    });
    btn.connect('clicked', onActivate);
    return btn;
}

export default class MaterialDockPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.material-dock');
        window._settings = settings;

        window.connect('close-request', () => {
            disconnectSettings(settings);
            return false;
        });

        window.default_width = 720;
        window.default_height = 640;

        // -------- Behavior --------
        const behaviorPage = new Adw.PreferencesPage({title: 'Behavior'});
        window.add(behaviorPage);

        const behaviorGroup = new Adw.PreferencesGroup({title: 'Dock behavior'});
        behaviorPage.add(behaviorGroup);

        addComboRow(behaviorGroup, settings,
            'click-action', 'Click action', 'What happens when clicking a running app icon',
            [['Focus or minimize', 'focus-or-minimize'],
                ['Focus window', 'focus'],
                ['Toggle minimize all', 'toggle-minimize'],
                ['Cycle windows', 'cycle-windows'],
                ['Show previews', 'previews'],
                ['Open new window', 'launch']]);

        addComboRow(behaviorGroup, settings,
            'middle-click-action', 'Middle-click action',
            'Choose whether middle-click opens a new window or activates the app',
            [['Open new window', 'new-window'],
                ['Activate app', 'activate']]);

        addComboRow(behaviorGroup, settings,
            'scroll-action', 'Scroll action', 'What happens when scrolling over a dock icon',
            [['Cycle windows', 'cycle-windows'],
                ['Switch workspace', 'switch-workspace'],
                ['Nothing', 'nothing']]);

        addComboRow(behaviorGroup, settings,
            'autohide-mode', 'Autohide mode',
            'Intelligent hides the dock only when a window overlaps it',
            [['Never hide', 'never'],
                ['Auto hide', 'always'],
                ['Intelligent', 'intelligent']]);

        const hideDelayRow = addIntSpinRow(behaviorGroup, settings,
            'autohide-timeout', 'Hide delay (ms)', 'Delay before the dock auto-hides',
            0, 5000, 50);

        const syncAutohideRows = () => {
            const hides = settings.get_string('autohide-mode') !== 'never';
            hideDelayRow.set_sensitive(hides);
        };
        connectSettings(settings, 'changed::autohide-mode', syncAutohideRows);
        syncAutohideRows();

        const tilesGroup = new Adw.PreferencesGroup({title: 'Windows'});
        behaviorPage.add(tilesGroup);

        addSwitchRow(tilesGroup, settings,
            'show-minimized-tiles', 'Minimized window tiles',
            'Show minimized windows as clickable tiles on the dock');
        addSwitchRow(tilesGroup, settings,
            'show-previews', 'Window previews on hover',
            'Show a preview panel with the app windows when hovering an icon');
        addSwitchRow(tilesGroup, settings,
            'show-favorites', 'Show favorite apps', '');
        addSwitchRow(tilesGroup, settings,
            'show-running', 'Show running apps', '');
        addSwitchRow(tilesGroup, settings,
            'show-show-apps-button', 'Show apps button', '');

        // -------- Appearance --------
        const appearancePage = new Adw.PreferencesPage({title: 'Appearance'});
        window.add(appearancePage);

        const appearanceGroup = new Adw.PreferencesGroup({title: 'Icons'});
        appearancePage.add(appearanceGroup);

        addIntComboRow(appearanceGroup, settings,
            'icon-size', 'Icon size', 'Size of app icons on the dock', ICON_SIZES);

        addSwitchRow(appearanceGroup, settings,
            'auto-fit-icons', 'Auto-fit icons',
            'Automatically shrink icons when the dock would overflow the screen');

        addComboRow(appearanceGroup, settings,
            'running-indicator', 'Running indicator', 'How running apps are marked',
            [['Dots', 'dots'],
                ['Bar', 'bars'],
                ['None', 'none']]);

        const magnifyGroup = new Adw.PreferencesGroup({title: 'Magnification'});
        appearancePage.add(magnifyGroup);

        addSwitchRow(magnifyGroup, settings,
            'magnify-enabled', 'Enable magnification', 'Grow icons toward the cursor');

        addComboRow(magnifyGroup, settings,
            'magnify-effect', 'Effect',
            'Zoom grows the icon in place, wave also grows its neighbors',
            [['Zoom', 'zoom'],
                ['Wave', 'wave'],
                ['Off', 'off']]);

        const magnifyScaleRow = addSpinRow(magnifyGroup, settings,
            'magnify-scale', 'Scale', 'Maximum icon scale', 1.0, 3.0, 0.05);

        const magnifyRangeRow = addIntSpinRow(magnifyGroup, settings,
            'magnify-range', 'Wave range', 'Neighbors affected by wave magnification', 0, 5, 1);
        const syncMagnifyRows = () => {
            const enabled = settings.get_boolean('magnify-enabled');
            const effect = settings.get_string('magnify-effect');
            magnifyScaleRow.set_sensitive(enabled && effect !== 'off');
            magnifyRangeRow.set_sensitive(enabled && effect === 'wave');
        };
        connectSettings(settings, 'changed::magnify-enabled', syncMagnifyRows);
        connectSettings(settings, 'changed::magnify-effect', syncMagnifyRows);
        syncMagnifyRows();

        // -------- Position --------
        const positionPage = new Adw.PreferencesPage({title: 'Position'});
        window.add(positionPage);

        const positionGroup = new Adw.PreferencesGroup({title: 'Placement'});
        positionPage.add(positionGroup);

        addComboRow(positionGroup, settings,
            'dock-position', 'Dock position', 'Place at the bottom or top of the screen',
            [['Bottom', 'bottom'],
                ['Top', 'top']]);

        addComboRow(positionGroup, settings,
            'dock-alignment', 'Alignment', 'Where along the edge the dock sits',
            [['Start', 'start'],
                ['Center', 'center'],
                ['End', 'end']]);

        addIntSpinRow(positionGroup, settings,
            'dock-margin', 'Margin (px)', 'Distance from the screen edge', 0, 200, 4);

        const dockFixedRow = addSwitchRow(positionGroup, settings,
            'dock-fixed', 'Reserve screen space',
            'Windows never overlap the dock (requires Never hide mode)');
        const syncDockFixedRow = () => {
            dockFixedRow.set_sensitive(settings.get_string('autohide-mode') === 'never');
        };
        connectSettings(settings, 'changed::autohide-mode', syncDockFixedRow);
        syncDockFixedRow();

        addIntSpinRow(positionGroup, settings,
            'monitor-index', 'Monitor', '0-based monitor index, -1 for primary', -1, 8, 1);

        // -------- Extras --------
        const extrasPage = new Adw.PreferencesPage({title: 'Extras'});
        window.add(extrasPage);

        const folderGroup = new Adw.PreferencesGroup({title: 'Folder stacks',
            description: 'Pin folders to the dock. Clicking shows a file popover.'});
        extrasPage.add(folderGroup);

        const refreshFolders = () => {
            clearGroupRows(folderGroup);
            for (const path of settings.get_strv('folder-stacks'))
                this._addFolderRow(folderGroup, settings, path);

            const entryRow = new Adw.EntryRow({title: 'Add folder path…'});
            const addFolderFromEntry = () => {
                const path = entryRow.get_text()?.trim();
                if (path && this._addFolder(settings, path))
                    entryRow.set_text('');
            };
            entryRow.connect('activate', addFolderFromEntry);
            entryRow.add_suffix(makeIconButton('list-add-symbolic', 'Add folder', addFolderFromEntry));
            entryRow.add_suffix(makeIconButton('folder-open-symbolic', 'Choose folder', () => {
                const chooser = Gtk.FileChooserNative.new(
                    'Choose folder', window, Gtk.FileChooserAction.SELECT_FOLDER,
                    'Select', 'Cancel');
                chooser.connect('response', (_chooser, response) => {
                    if (response === Gtk.ResponseType.ACCEPT) {
                        const file = chooser.get_file();
                        const path = file?.get_path();
                        if (path)
                            this._addFolder(settings, path);
                    }
                    chooser.destroy();
                });
                chooser.show();
            }));
            folderGroup.add(entryRow);
        };
        connectSettings(settings, 'changed::folder-stacks', refreshFolders);
        refreshFolders();

        const groupGroup = new Adw.PreferencesGroup({title: 'App groups',
            description: 'Groups of apps shown as a single tile. Format: Label|id1,id2'});
        extrasPage.add(groupGroup);

        const refreshGroups = () => {
            clearGroupRows(groupGroup);
            for (const entry of settings.get_strv('app-groups'))
                this._addGroupRow(groupGroup, settings, entry);

            const labelRow = new Adw.EntryRow({title: 'Group name…'});
            const idsRow = new Adw.EntryRow({title: 'App IDs (id1,id2,id3)…'});
            const addBtn = makeIconButton('list-add-symbolic', 'Add group', () => {
                const label = labelRow.get_text()?.trim();
                const ids = idsRow.get_text()?.trim();
                if (label && ids && this._addGroup(settings, label, ids)) {
                    labelRow.set_text('');
                    idsRow.set_text('');
                }
            });
            idsRow.add_suffix(makeIconButton('view-app-grid-symbolic',
                'Choose installed apps', () => this._chooseAppIds(window, idsRow)));
            idsRow.add_suffix(addBtn);
            groupGroup.add(labelRow);
            groupGroup.add(idsRow);
        };
        connectSettings(settings, 'changed::app-groups', refreshGroups);
        refreshGroups();
    }

    _addFolderRow(group, settings, path) {
        const row = new Adw.ActionRow({title: path});
        row.add_suffix(makeIconButton('user-trash-symbolic', 'Remove', () => {
            const paths = settings.get_strv('folder-stacks').filter(p => p !== path);
            settings.set_strv('folder-stacks', paths);
        }));
        group.add(row);
    }

    _addFolder(settings, path) {
        if (path === '~')
            path = GLib.get_home_dir();
        else if (path.startsWith('~/'))
            path = `${GLib.get_home_dir()}/${path.slice(2)}`;

        // Folder stacks are persisted as absolute, normalized paths. Relative
        // paths depend on the process working directory and can silently point
        // somewhere different when the extension is loaded by GNOME Shell.
        if (!GLib.path_is_absolute(path))
            return false;

        const normalizedPath = GLib.canonicalize_filename(path, null);
        const file = Gio.File.new_for_path(normalizedPath);
        if (file.query_file_type(Gio.FileQueryInfoFlags.NONE, null) !== Gio.FileType.DIRECTORY)
            return false;

        const paths = settings.get_strv('folder-stacks');
        if (paths.some(existing => GLib.canonicalize_filename(existing, null) === normalizedPath))
            return false;
        paths.push(normalizedPath);
        settings.set_strv('folder-stacks', paths);
        return true;
    }

    _chooseAppIds(window, idsRow) {
        const apps = Gio.AppInfo.get_all()
            .filter(app => app.get_id() && app.should_show())
            .sort((a, b) => a.get_display_name().localeCompare(b.get_display_name()));

        const dialog = new Gtk.Dialog({
            title: 'Choose apps for group',
            transient_for: window,
            modal: true,
        });
        dialog.set_default_size(480, 560);
        dialog.add_button('Cancel', Gtk.ResponseType.CANCEL);
        dialog.add_button('Use selected apps', Gtk.ResponseType.ACCEPT);

        const content = dialog.get_content_area();
        const search = new Gtk.SearchEntry({placeholder_text: 'Search apps…'});
        content.append(search);

        const list = new Gtk.ListBox({
            selection_mode: Gtk.SelectionMode.MULTIPLE,
            vexpand: true,
        });
        list.set_filter_func(row => {
            const query = search.get_text().trim().toLowerCase();
            return !query || row._appName.toLowerCase().includes(query) ||
                row._appId.toLowerCase().includes(query);
        });

        for (const app of apps) {
            const appId = app.get_id();
            const appName = app.get_display_name() || appId;
            const row = new Gtk.ListBoxRow({
                child: new Gtk.Label({
                    label: `${appName} (${appId})`,
                    xalign: 0,
                    margin_start: 8,
                    margin_end: 8,
                    margin_top: 6,
                    margin_bottom: 6,
                }),
            });
            row._appId = appId;
            row._appName = appName;
            list.append(row);
        }

        search.connect('search-changed', () => list.invalidate_filter());
        const scroller = new Gtk.ScrolledWindow({
            child: list,
            vexpand: true,
            hscrollbar_policy: Gtk.PolicyType.NEVER,
        });
        content.append(scroller);

        dialog.connect('response', (_dialog, response) => {
            if (response === Gtk.ResponseType.ACCEPT) {
                const selectedIds = list.get_selected_rows().map(row => row._appId);
                if (selectedIds.length > 0)
                    idsRow.set_text(selectedIds.join(','));
            }
            dialog.destroy();
        });
        dialog.present();
    }

    _addGroupRow(group, settings, entry) {
        const row = new Adw.ActionRow({title: entry});
        row.add_suffix(makeIconButton('user-trash-symbolic', 'Remove', () => {
            const groups = settings.get_strv('app-groups').filter(g => g !== entry);
            settings.set_strv('app-groups', groups);
        }));
        group.add(row);
    }

    _addGroup(settings, label, ids) {
        label = label.trim();
        const appIds = ids.split(',').map(id => id.trim()).filter(Boolean);
        if (!label || label.includes('|') || appIds.length === 0 ||
            appIds.some(id => id.includes('|') || id.includes(',')))
            return false;

        const uniqueIds = [...new Set(appIds)];
        const groups = settings.get_strv('app-groups');
        const full = `${label}|${uniqueIds.join(',')}`;
        if (groups.includes(full))
            return false;

        groups.push(full);
        settings.set_strv('app-groups', groups);
        return true;
    }
}