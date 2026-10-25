/**
 * Select visible, taskbar-managed windows to minimize for Show Desktop.
 * Kept pure so monitor and pre-minimized-window behavior can be tested without
 * loading GNOME Shell.
 */
export function getWindowsToMinimize(windows, primaryMonitorIndex) {
    return windows.filter(win =>
        win &&
        !win.skip_taskbar &&
        !win.minimized &&
        win.get_monitor() === primaryMonitorIndex &&
        win.get_compositor_private());
}
