import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {MaterialDockManager} from './lib/manager.js';

export default class MaterialDockExtension extends Extension {
    enable() {
        this._manager = new MaterialDockManager(this);
    }

    disable() {
        this._manager?.destroy();
        this._manager = null;
    }
}