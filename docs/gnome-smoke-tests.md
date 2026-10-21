# GNOME Shell smoke-test checklist

Automated Node tests cover pure helper functions only. Run this checklist in a real
GNOME Shell session for integration behavior that cannot be validated by CI.

## Setup
- [ ] Install the extension and compile schemas with `glib-compile-schemas schemas/`.
- [ ] Enable the extension and confirm there are no Material Dock errors in the journal.
- [ ] Repeat on every GNOME Shell version declared in `metadata.json`.

## Dock interaction
- [ ] Right-click the dock background and an app icon; the context menu opens without launching or activating the app.
- [ ] Dismiss the context menu by clicking outside, then reopen it repeatedly.
- [ ] Change dock position, alignment, icon size, and autohide mode from both preferences and the context menu.

## Layout and visibility
- [ ] Test auto-fit with many pinned/running apps and on a small display.
- [ ] Test never-hide, auto-hide, and intelligent-hide modes while moving, resizing, minimizing, restoring, and changing workspaces for overlapping windows.
- [ ] Move the pointer from dock icons into the preview panel and rapidly between icons; confirm previews stay open only while expected.
- [ ] Disable/re-enable the extension while the dock is hidden, a preview is open, and a popover is loading.

## Window behavior
- [ ] Test click actions, middle-click policy, Ctrl-click, and scrolling over running and stopped apps.
- [ ] Open multiple windows for one app; activate each preview and close one with its close button and middle-click.
- [ ] Verify minimized tiles restore and close the intended window.

## Stacks and monitors
- [ ] Open folder stacks with ordinary paths, `~` paths, empty folders, unreadable folders, and folders with many files; close the popover while loading.
- [ ] Test app groups with missing desktop IDs and switch dock position while group popovers are open.
- [ ] Add/remove/reorder monitors and verify the configured monitor is respected when available.

Record GNOME version, display server (Wayland/X11), reproduction steps, and journal
errors for any failure. Do not close issues that require these checks until tested.
