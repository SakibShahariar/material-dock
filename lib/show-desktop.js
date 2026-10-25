/**
 * Select visible, taskbar-managed windows to minimize for Show Desktop.
 * A window can be unmanaged while this list is inspected, so stale Meta.Window
 * objects are ignored rather than aborting the whole operation.
 */
export function getWindowsToMinimize(windows, primaryMonitorIndex) {
    return windows.filter(win => {
        try {
            return !!win &&
                !win.skip_taskbar &&
                !win.minimized &&
                win.get_monitor() === primaryMonitorIndex &&
                !!win.get_compositor_private();
        } catch {
            return false;
        }
    });
}

/** Return windows from the Show Desktop operation that are still restorable. */
export function getWindowsToRestore(windows) {
    return windows.filter(win => {
        try {
            return !!win && win.minimized && !!win.get_compositor_private();
        } catch {
            return false;
        }
    });
}
