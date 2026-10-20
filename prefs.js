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
            entryRow.connect('activate', () => {
                const path = entryRow.get_text()?.trim();
                if (path)
                    this._addFolder(settings, path);
                entryRow.set_text('');
            });
            const addBtn = makeIconButton('list-add-symbolic', 'Add folder', () => {
                const path = entryRow.get_text()?.trim();
                if (path) {
                    this._addFolder(settings, path);
                    entryRow.set_text('');
                }
            });
            entryRow.add_suffix(addBtn);
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
                if (label && ids) {
                    this._addGroup(settings, label, ids);
                    labelRow.set_text('');
                    idsRow.set_text('');
                }
            });
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

        const paths = settings.get_strv('folder-stacks');
        if (paths.includes(path))
            return;
        paths.push(path);
        settings.set_strv('folder-stacks', paths);
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
        const groups = settings.get_strv('app-groups');
        const full = `${label}|${ids}`;
        if (groups.includes(full))
            return;
        groups.push(full);
        settings.set_strv('app-groups', groups);
    }
}