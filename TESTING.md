# Testing Material Dock

Material Dock depends on GNOME Shell and its Mutter/Clutter runtime. Static checks can catch malformed metadata, JavaScript syntax errors, invalid GSettings schemas, and installer shell issues, but they cannot prove that the extension behaves correctly in a live GNOME session.

## Automated checks

GitHub Actions runs these checks on pushes to `main`, pull requests, and manual dispatch:

- Parse and validate required fields in `metadata.json`.
- Parse every JavaScript file for syntax errors.
- Run Node.js unit tests for auto-fit sizing and smooth-scroll accumulation, including thresholds, direction changes, fractional remainders, rounding, and minimum-size boundaries.
- Test explicit visibility-state decisions, including reversing an in-progress show/hide transition.
- Check literal GSettings references against declared schema keys.
- Compile the GSettings schema in strict mode.
- Check `install.sh` syntax with Bash.
- Run ShellCheck against `install.sh`.

## GNOME session smoke-test checklist

Run these checks after installing the extension in a disposable GNOME user/session. Record the GNOME Shell version and whether the session is Wayland or X11.

- [ ] Enable the extension; confirm there are no errors in the Shell log.
- [ ] Open Preferences and change icon size, dock position/alignment, margin, and autohide settings.
- [ ] Enable/disable magnification and switch between zoom and wave effects.
- [ ] Move, resize, maximize, restore, and minimize windows across the dock edge; verify intelligent autohide updates.
- [ ] Switch workspaces and monitors; verify dock placement and overlap detection.
- [ ] Hover app icons and move the pointer between an icon and its preview; verify previews close after leaving the hover corridor.
- [ ] Rapidly move between app icons; confirm preview polling does not continue after previews close.
- [ ] Exercise click, middle-click, scroll, window cycling, and minimize/restore actions.
- [ ] Disable and re-enable the extension; confirm timers, pointer watches, signals, and UI actors are cleaned up.
- [ ] Repeat the checks on every GNOME Shell version declared in `metadata.json`.

## Limitations

The automated workflow is static validation, not a GNOME Shell integration test. Behavior that depends on Shell actors, Mutter windows, monitor topology, animations, and pointer position still requires a live session.
