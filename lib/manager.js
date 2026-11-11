import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {MaterialDock} from './dock.js';
import {MatugenTheme} from './theme.js';
import {GlobalSignalsHandler} from './utils.js';

export class MaterialDockManager {
    constructor(extension) {
        this.extension = extension;
        this._settings = extension.getSettings('org.gnome.shell.extensions.material-dock');
        this._signals = new GlobalSignalsHandler(this);
        this._theme = new MatugenTheme(this._settings);

        this._createDock();
        this._theme.apply();

        // The dock owns monitor-topology changes and repositions itself. Recreate
        // it only when the user changes the configured monitor index.
        this._signals.add([this._settings, 'changed::monitor-index', () => this._recreateDock()]);
    }

    get settings() {
        return this._settings;
    }

    get dock() {
        return this._dock;
    }

    _preferredMonitorIndex() {
        const monitors = Main.layoutManager.monitors;
        if (monitors.length === 0) return 0;

        let index = this._settings.get_int('monitor-index');
        if (index < 0 || index >= monitors.length) index = Main.layoutManager.primaryIndex;
        return index;
    }

    _createDock() {
        try {
            this._dock = new MaterialDock(this._settings, this._preferredMonitorIndex(), () =>
                this.extension.openPreferences(),
            );
        } catch (error) {
            this._dock = null;
            logError(error, 'Material Dock: failed to create dock');
        }
    }

    _recreateDock() {
        if (this._dock?.monitorIndex === this._preferredMonitorIndex() && this._dock?.get_parent())
            return;

        try {
            this._dock?.destroy();
        } catch (error) {
            logError(error, 'Material Dock: failed to destroy dock before recreation');
        }
        this._dock = null;
        this._createDock();
    }

    destroy() {
        this._theme?.destroy();
        this._theme = null;
        this._signals.destroy();
        this._dock?.destroy();
        this._dock = null;
    }
}
