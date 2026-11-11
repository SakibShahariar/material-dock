import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import {generateMatugenStylesheet, hasRequiredMatugenColors, parseMatugenColors} from './matugen-colors.js';

const MATUGEN_COLORS = `${GLib.get_home_dir()}/.config/matugen/matugen-colors.css`;

export class MatugenTheme {
    constructor(settings) {
        this._settings = settings;
        this._file = Gio.File.new_for_path(MATUGEN_COLORS);
        this._monitorId = null;
        this._cssPath = `${GLib.get_user_cache_dir()}/material-dock-matugen.css`;
        this._sourceId = 0;
        this._stylesheetLoaded = false;
    }

    apply() {
        this._load();
        this._startMonitor();
    }

    _setSource(source) {
        if (this._settings.get_string('theme-source') !== source)
            this._settings.set_string('theme-source', source);
    }

    _load() {
        try {
            // If Matugen is removed, stop applying its last cached palette and
            // let the base stylesheet inherit GNOME Shell's theme colors.
            if (!this._file.query_exists(null)) {
                this._unloadStylesheet();
                this._setSource('gnome-shell');
                return false;
            }

            const [, contents] = this._file.load_contents(null);
            const text = new TextDecoder().decode(contents);
            const vars = parseMatugenColors(text);
            if (!hasRequiredMatugenColors(vars)) {
                this._unloadStylesheet();
                this._setSource('gnome-shell');
                return false;
            }

            const css = generateMatugenStylesheet(vars);
            const cacheDir = Gio.File.new_for_path(GLib.get_user_cache_dir());
            if (!cacheDir.query_exists(null)) cacheDir.make_directory_with_parents(null);

            const cssFile = Gio.File.new_for_path(this._cssPath);
            cssFile.replace_contents(
                new TextEncoder().encode(css),
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null,
            );

            const theme = St.ThemeContext.get_for_stage(global.stage).get_theme();
            if (this._stylesheetLoaded) theme.unload_stylesheet(cssFile);
            theme.load_stylesheet(cssFile);
            this._stylesheetLoaded = true;
            this._setSource('matugen');
            return true;
        } catch (e) {
            this._unloadStylesheet();
            this._setSource('gnome-shell');
            logError(e, 'MatugenTheme.apply');
            return false;
        }
    }

    _unloadStylesheet() {
        if (!this._stylesheetLoaded) return;

        try {
            const theme = St.ThemeContext.get_for_stage(global.stage)?.get_theme();
            theme?.unload_stylesheet?.(Gio.File.new_for_path(this._cssPath));
        } catch {}
        this._stylesheetLoaded = false;
    }

    _startMonitor() {
        try {
            // Monitor the parent directory so creation of the colors file
            // after startup is observed too.
            const parent = this._file.get_parent();
            if (!parent) return;

            this._monitorId = parent.monitor_directory(Gio.FileMonitorFlags.NONE, null);
            this._monitorId.connect('changed', (_mon, file, otherFile, event) => {
                const targetName = this._file.get_basename();
                const matchesTarget = candidate => candidate?.get_basename() === targetName;
                if (!matchesTarget(file) && !matchesTarget(otherFile)) return;

                if (
                    event === Gio.FileMonitorEvent.CREATED ||
                    event === Gio.FileMonitorEvent.MOVED_IN ||
                    event === Gio.FileMonitorEvent.CHANGED ||
                    event === Gio.FileMonitorEvent.CHANGES_DONE_HINT ||
                    event === Gio.FileMonitorEvent.MOVED_OUT ||
                    event === Gio.FileMonitorEvent.DELETED
                ) {
                    if (this._sourceId) GLib.source_remove(this._sourceId);
                    this._sourceId = GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, 250, () => {
                        this._sourceId = 0;
                        this._load();
                    });
                }
            });
        } catch (e) {
            logError(e, 'MatugenTheme._startMonitor');
        }
    }

    destroy() {
        if (this._sourceId) {
            GLib.source_remove(this._sourceId);
            this._sourceId = 0;
        }

        try {
            this._monitorId?.cancel();
            this._monitorId = null;
        } catch {}

        this._unloadStylesheet();
        this._setSource('gnome-shell');
    }
}
