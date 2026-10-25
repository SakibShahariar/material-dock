/**
 * Keep only apps that have a taskbar-visible window on the active workspace.
 * Favorites are handled separately so pinned launchers remain available.
 */
export function filterAppsToWorkspace(apps, workspace) {
    return apps.filter(app => app.get_windows().some(win =>
        !win.skip_taskbar && win.workspace === workspace));
}
