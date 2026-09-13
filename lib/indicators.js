import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Main from 'resource:///org/gnome/shell/ui/main.js';

const DOT_SIZE = 6;
const BAR_SIZE = 4;

export const RunningIndicator = GObject.registerClass(
class RunningIndicator extends St.Widget {
    _init(params) {
        super._init({
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.END,
            x_expand: false,
            y_expand: false,
            style_class: 'material-dock-indicator',
            ...params,
        });
        this._countLabel = new St.Label({
            style_class: 'material-dock-indicator-count',
            x_align: Clutter.ActorAlign.END,
            y_align: Clutter.ActorAlign.START,
            visible: false,
        });
        this.add_child(this._countLabel);
        this._dots = [];
        this._drawDots(3);
    }

    _drawDots(n) {
        this._dots.forEach(d => d.destroy());
        this._dots = [];
        for (let i = 0; i < n; i++) {
            const dot = new St.Widget({
                style_class: 'material-dock-indicator-dot',
                width: DOT_SIZE,
                height: DOT_SIZE,
            });
            this.add_child(dot);
            this._dots.push(dot);
        }
        this._updateLayout(n);
    }

    _updateLayout(n) {
        const spacing = 3;
        const totalWidth = n * DOT_SIZE + (n - 1) * spacing;
        this._dots.forEach((dot, i) => {
            dot.x = i * (DOT_SIZE + spacing) + (this.width - totalWidth) / 2;
            dot.y = 0;
        });
        this.width = Math.max(this.width, totalWidth);
        this.height = DOT_SIZE + 4;
    }

    updateState(running, focused, urgent, windowCount) {
        const n = this._dots.length;
        if (windowCount > 0 && n !== Math.min(windowCount, 5))
            this._drawDots(Math.min(windowCount, 5));

        this._dots.forEach((dot, i) => {
            if (urgent) {
                dot.style_class = 'material-dock-indicator-dot urgent';
            } else if (focused) {
                dot.style_class = i === 0
                    ? 'material-dock-indicator-dot active-bar'
                    : 'material-dock-indicator-dot';
            } else if (running) {
                dot.style_class = 'material-dock-indicator-dot running';
            } else {
                dot.style_class = 'material-dock-indicator-dot';
            }
        });

        if (windowCount > 5) {
            this._countLabel.set_text(`+${windowCount - 5}`);
            this._countLabel.visible = true;
        } else {
            this._countLabel.visible = false;
        }
    }

    updateForBars(running, focused, urgent, windowCount) {
        this._dots.forEach(d => d.destroy());
        this._dots = [];

        const bar = new St.Widget({
            style_class: 'material-dock-indicator-bar',
            height: BAR_SIZE,
            width: DOT_SIZE * 4,
        });
        this.add_child(bar);
        this._dots.push(bar);
        this.height = BAR_SIZE + 4;

        if (urgent) {
            bar.style_class = 'material-dock-indicator-bar urgent';
        } else if (focused) {
            bar.style_class = 'material-dock-indicator-bar active';
        } else if (running) {
            bar.style_class = 'material-dock-indicator-bar running';
        }
    }
});
