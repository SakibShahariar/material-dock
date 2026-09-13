import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const DOT_SIZE = 6;
const DOT_SPACING = 3;

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
                x_align: Clutter.ActorAlign.CENTER,
            }),
            ...params,
        });
        this._dots = [];
        this._drawDots(3);
    }

    vfunc_get_preferred_width(forHeight) {
        const n = this._dots.length;
        const w = n * DOT_SIZE + Math.max(0, n - 1) * DOT_SPACING;
        return [w, w];
    }

    vfunc_get_preferred_height(forWidth) {
        return [DOT_SIZE, DOT_SIZE];
    }

    _drawDots(n) {
        this._dots.forEach(d => d.destroy());
        this._dots = [];
        for (let i = 0; i < n; i++) {
            const dot = new St.Widget({
                style_class: 'material-dock-indicator-dot',
                width: DOT_SIZE,
                height: DOT_SIZE,
                x_expand: false,
                y_expand: false,
            });
            this.add_child(dot);
            this._dots.push(dot);
        }
    }

    updateState(running, focused, urgent, windowCount) {
        const n = Math.min(windowCount || 1, 5);
        if (this._dots.length !== n)
            this._drawDots(n);

        this._dots.forEach((dot, i) => {
            if (urgent) {
                dot.style_class = 'material-dock-indicator-dot urgent';
            } else if (focused) {
                dot.style_class = i === 0
                    ? 'material-dock-indicator-dot focused'
                    : 'material-dock-indicator-dot running';
            } else if (running) {
                dot.style_class = 'material-dock-indicator-dot running';
            } else {
                dot.style_class = 'material-dock-indicator-dot';
            }
        });
        this.visible = n > 0;
    }

    updateForBars(running, focused, urgent, windowCount) {
        this._dots.forEach(d => d.destroy());
        this._dots = [];
        const n = Math.min(windowCount || 1, 5);
        for (let i = 0; i < n; i++) {
            const bar = new St.Widget({
                style_class: 'material-dock-indicator-bar',
                height: 4,
                width: DOT_SIZE,
                x_expand: false,
                y_expand: false,
            });
            if (urgent)
                bar.style_class = 'material-dock-indicator-bar urgent';
            else if (focused && i === 0)
                bar.style_class = 'material-dock-indicator-bar focused';
            else if (running)
                bar.style_class = 'material-dock-indicator-bar running';

            this.add_child(bar);
            this._dots.push(bar);
        }
        this.visible = n > 0;
    }
});
