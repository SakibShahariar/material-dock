import Clutter from 'gi://Clutter';
import Graphene from 'gi://Graphene';
import St from 'gi://St';
import {log} from './utils.js';

const COSINE_RANGE_FACTOR = 2.2;

export class Magnifier {
    constructor(dock) {
        this._dock = dock;
        this._settings = dock.settings;
        this._scale = 1.0;
        this._range = 2;
        this._enabled = true;
        this._effect = 'zoom';
        this._hoveredItem = null;
        this._updateFromSettings();
    }

    _updateFromSettings() {
        this._enabled = this._settings.get_boolean('magnify-enabled');
        this._effect = this._settings.get_string('magnify-effect');
        this._scale = this._settings.get_double('magnify-scale');
        this._range = this._settings.get_int('magnify-range');

        if (!this._enabled || this._effect === 'off')
            this.resetAll();
    }

    onSettingsChanged() {
        this._updateFromSettings();
    }

    onItemHover(item, entered) {
        if (!this._enabled || this._effect === 'off') { log(`MAGSKIP enabled=${this._enabled} effect=${this._effect}`); return; }
        log(`MAG onItemHover entered=${entered} enabled=${this._enabled} effect=${this._effect} scale=${this._scale}`);

        if (entered) {
            this._hoveredItem = item;
            this._applyMagnify(item);
        } else if (this._hoveredItem === item) {
            this._hoveredItem = null;
            this._resetAll();
        }
    }

    _applyMagnify(hoveredItem) {
        const box = this._dock.dash._box;
        if (!box) return;

        const children = box.get_children().filter(c => c.child);
        const hoveredIdx = children.indexOf(hoveredItem);
        log(`MAG apply n=${children.length} isHoveredItemInChildren=${hoveredIdx !== -1}`);
        if (hoveredIdx === -1) return;

        children.forEach((item, i) => {
            const dist = Math.abs(i - hoveredIdx);
            if (dist === 0) {
                this._setScale(item, this._scale);
            } else if (this._effect === 'wave' && dist <= this._range) {
                const factor = Math.cos((dist * Math.PI) / (2 * (this._range + 1)));
                const s = 1.0 + (this._scale - 1.0) * factor;
                this._setScale(item, s);
            } else {
                this._setScale(item, 1.0);
            }
        });
    }

    _setScale(item, s) {
        if (!item.child) return;
        const pivotY = this._dock._dockPosition === 'top' ? 0.05 : 0.95;
        item.child.pivot_point = new Graphene.Point({x: 0.5, y: pivotY});
        item.child.ease({
            scale_x: s,
            scale_y: s,
            duration: 150,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });
    }

    _resetAll() {
        const box = this._dock.dash?._box;
        if (!box) return;

        for (const item of box.get_children()) {
            if (item.child) {
                item.child.ease({
                    scale_x: 1.0,
                    scale_y: 1.0,
                    duration: 150,
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                });
            }
        }
    }

    resetAll() {
        this._hoveredItem = null;
        this._resetAll();
    }

    destroy() {
        this._resetAll();
    }
}
