import St from 'gi://St';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {MaterialDockManager} from './lib/manager.js';

export default class MaterialDockExtension extends Extension {
    enable() {
        this._stylesheet = this.dir.get_child('stylesheet.css');
        St.ThemeContext.get_for_stage(global.stage).get_theme().load_stylesheet(this._stylesheet);
        this._manager = new MaterialDockManager(this);
    }

    disable() {
        this._manager?.destroy();
        this._manager = null;
        St.ThemeContext.get_for_stage(global.stage)
            .get_theme()
            .unload_stylesheet(this._stylesheet);
        this._stylesheet = null;
    }
}
