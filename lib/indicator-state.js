/**
 * Resolve the CSS class for one running indicator, independently of GNOME UI.
 * Urgency takes precedence, then the focused-window marker, then running state.
 */
export function getIndicatorStyle(running, focused, urgent, index, mode = 'dots') {
    const baseClass =
        mode === 'bars' ? 'material-dock-indicator-bar' : 'material-dock-indicator-dot';

    if (urgent) return `${baseClass} urgent`;
    if (focused && index === 0) return `${baseClass} focused`;
    if (running || focused) return `${baseClass} running`;
    return baseClass;
}
