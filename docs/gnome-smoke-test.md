# GNOME Shell smoke-test checklist

Run these checks in a real GNOME Shell session after installing the extension. Automated Node tests do not load GNOME Shell, Mutter, or libadwaita APIs, so passing CI is not a substitute for these checks.

## Enable, disable, and settings

- [ ] Enable the extension; confirm the dock appears on the configured edge without Shell errors.
- [ ] Open Preferences, change icon size, position, magnification, and autohide settings; confirm changes apply without restarting Shell.
- [ ] Disable and re-enable the extension several times; confirm no duplicate docks, stale actors, or recurring errors.
- [ ] Log out or restart the session after disabling; confirm no extension-owned timers or callbacks continue to run.

## Pointer and visibility behavior

- [ ] Move the pointer onto and away from the reveal strip; confirm the dock reveals and hides at the configured delay.
- [ ] Reverse direction during a reveal/hide animation; confirm the dock reaches the latest requested state.
- [ ] Move, resize, maximize, minimize, and restore a window across the dock edge; verify intelligent autohide updates.
- [ ] Switch workspaces and monitors while windows overlap the dock; confirm visibility follows the active workspace and monitor.
- [ ] Enter and leave Overview and fullscreen; record the actual behavior against the selected settings.

## App interactions

- [ ] Left-click a running app to focus it; test each configured click policy, including minimize and window cycling.
- [ ] Toggle “Current workspace only” and switch workspaces; running icons should update immediately while favorites remain pinned.
- [ ] Middle-click apps that support opening a new window and apps that do not; verify the configured policy.
- [ ] Right-click the dock background and an app icon; confirm the context menu opens without also activating the app.
- [ ] Open previews, move the pointer from the dock into a preview, rapidly switch between apps, and close previews; confirm polling stops afterward.
- [ ] Move the pointer through the gap between dock and preview at several angles; the preview should stay open inside the padded corridor and close after leaving it.
- [ ] Test running, focused, urgent, minimized, and closed app indicators.
- [ ] Open a folder stack and app group; test item activation, popover placement, and dismissal by clicking outside.

## Record results

For each supported GNOME Shell version, record the GNOME version, session type (Wayland/X11), steps tested, pass/fail, and relevant Shell journal errors. Do not declare a Shell version supported based only on static checks.
