import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

const DOT_SIZE = 6;
const DOT_SPACING = 3;
const MAX_INDICATORS = 5;

export const RunningIndicator = GObject.registerClass(
class RunningIndicator extends St.Widget {
    _init(params) {
        super._init({
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.END,
            x_expand: false,
            y_expand: false,
            style_class: 'material-dock-indicator',
            layout_manager: new Clutter.BoxLayout({
                orientation: Clutter.Orientation.HORIZONTAL,
                spacing: DOT_SPACING,
            }),
            ...params,
        });
        this._dots = [];
        this._mode = 'dots';
        this._ensureIndicators(3, 'dots');
    }

    vfunc_get_preferred_width(forHeight) {
        const n = this._dots.length;
        const w = n * DOT_SIZE + Math.max(0, n - 1) * DOT_SPACING;
        return [w, w];
    }

    vfunc_get_preferred_height(forWidth) {
        return [DOT_SIZE, DOT_SIZE];
    }

    _ensureIndicators(count, mode) {
        if (this._mode === mode && this._dots.length === count)
            return;

        this._dots.forEach(dot => dot.destroy());
        this._dots = [];
        this._mode = mode;

        for (let i = 0; i < count; i++) {
            const isBar = mode === 'bars';
            const indicator = new St.Widget({
                style_class: isBar
                    ? 'material-dock-indicator-bar'
                    : 'material-dock-indicator-dot',
                width: DOT_SIZE,
                height: isBar ? 4 : DOT_SIZE,
                x_expand: false,
                y_expand: false,
            });
            this.add_child(indicator);
            this._dots.push(indicator);
        }
    }

    _updateStyles(running, focused, urgent, mode) {
        const baseClass = mode === 'bars'
            ? 'material-dock-indicator-bar'
            : 'material-dock-indicator-dot';

        this._dots.forEach((indicator, i) => {
            if (urgent) {
                indicator.style_class = `${baseClass} urgent`;
            } else if (focused && i === 0) {
                indicator.style_class = `${baseClass} focused`;
            } else if (running || focused) {
                indicator.style_class = `${baseClass} running`;
            } else {
                indicator.style_class = baseClass;
            }
        });
        this.visible = this._dots.length > 0;
    }

    updateState(running, focused, urgent, windowCount) {
        const count = Math.min(Math.max(0, windowCount), MAX_INDICATORS);
        this._ensureIndicators(count, 'dots');
        this._updateStyles(running, focused, urgent, 'dots');
    }

    updateForBars(running, focused, urgent, windowCount) {
        const count = Math.min(Math.max(0, windowCount), MAX_INDICATORS);
        this._ensureIndicators(count, 'bars');
        this._updateStyles(running, focused, urgent, 'bars');
    }
});
