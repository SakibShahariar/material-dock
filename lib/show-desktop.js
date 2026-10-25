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

/**
 * Return only windows that remain alive and minimized from the Show Desktop
 * operation, avoiding attempts to restore closed or already-restored windows.
 */
export function getWindowsToRestore(windows) {
    return windows.filter(win =>
        win &&
        win.minimized &&
        win.get_compositor_private());
}
