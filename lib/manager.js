import Main from 'resource:///org/gnome/shell/ui/main.js';

import {MaterialDock} from './dock.js';
import {GlobalSignalsHandler} from './utils.js';

export class MaterialDockManager {
    constructor(extension) {
        this.extension = extension;
        this._settings = extension.getSettings('org.gnome.shell.extensions.material-dock');
        this._signals = new GlobalSignalsHandler(this);

        this._createDock();

        this._signals.add(
            [this._settings, 'changed::monitor-index', () => this._recreateDock()],
            [global.display, 'monitors-changed', () => this._recreateDock()]);
    }

    get settings() {
        return this._settings;
    }

    get dock() {
        return this._dock;
    }

    _preferredMonitorIndex() {
        const monitors = Main.layoutManager.monitors;
        if (monitors.length === 0)
            return 0;

        let index = this._settings.get_int('monitor-index');
        if (index < 0 || index >= monitors.length)
            index = Main.layoutManager.primaryIndex;
        return index;
    }

    _createDock() {
        this._dock = new MaterialDock(
            this._settings,
            this._preferredMonitorIndex(),
            () => this.extension.openPreferences());
    }

    _recreateDock() {
        if (this._dock.monitorIndex === this._preferredMonitorIndex() && this._dock.get_parent())
            return;
        this._dock?.destroy();
        this._dock = null;
        this._createDock();
    }

    destroy() {
        this._signals.destroy();
        this._dock?.destroy();
        this._dock = null;
    }
}