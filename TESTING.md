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

## Prepare and capture evidence

Run the automated checks first from the repository checkout:

```sh
npm test
node --version
git rev-parse HEAD
glib-compile-schemas --strict schemas/
bash -n install.sh
```

Install or update the extension in the current user account:

```sh
./install.sh
gnome-extensions info material-dock@SakibShahariar
gnome-extensions enable material-dock@SakibShahariar
```

Follow relevant logs while reproducing a problem:

```sh
journalctl -f -o cat | grep -iE 'material-dock|gnome-shell|mutter'
```

Keep the exact commit SHA, GNOME Shell version, session type, reproduction steps, and relevant log excerpt with the result. Redact unrelated personal information from logs before sharing them.

### Reload differences

- **X11:** after changing extension files, `Alt+F2` then `r` can restart GNOME Shell. Log out first if the session does not support this path.
- **Wayland:** do not rely on `Alt+F2` → `r`; log out and back in, or use a nested `gnome-shell --devkit` session when available.
- **Both:** check the extension state and logs after reload. A successful `npm test` or CI run does not mean the extension was loaded in GNOME Shell.

For Wayland multi-monitor, fractional-scaling, hotplug, fullscreen, previews, stacks, theme, and lifecycle cases, follow the [Wayland validation matrix](docs/wayland-validation-matrix.md). Use the [GNOME Shell smoke-test checklist](docs/gnome-smoke-test.md) for the broader interaction sweep.

## GNOME session smoke-test checklist

Run these checks after installing the extension in a disposable GNOME user/session. Record the GNOME Shell version and whether the session is Wayland or X11.

- [ ] Enable the extension; confirm there are no errors in the Shell log.
- [ ] Open Preferences and change icon size, dock position/alignment, margin, and autohide settings.
- [ ] Verify irrelevant preference rows disable correctly; try folder chooser/path validation, app-group app selection, and monitor selection with one and multiple displays.
- [ ] Enable/disable magnification and switch between zoom and wave effects.
- [ ] Move, resize, maximize, restore, and minimize windows across the dock edge; verify intelligent autohide updates.
- [ ] Switch workspaces and monitors; verify dock placement and overlap detection.
- [ ] Hover app icons and move the pointer between an icon and its preview; verify previews close after leaving the hover corridor.
- [ ] Close a previewed window using its close button and middle-click; verify the intended window closes and the card does not activate it accidentally.
- [ ] Open a folder stack with many files, then dismiss it during enumeration; verify cancellation does not leave callbacks or file enumerators active.
- [ ] Rapidly move between app icons; confirm preview polling does not continue after previews close.
- [ ] Exercise click, middle-click, scroll, window cycling, and minimize/restore actions.
- [ ] Disable and re-enable the extension; confirm timers, pointer watches, signals, and UI actors are cleaned up.
- [ ] Repeat the checks on every GNOME Shell version declared in `metadata.json`.

## Limitations

The automated workflow is static validation, not a GNOME Shell integration test. Behavior that depends on Shell actors, Mutter windows, monitor topology, animations, and pointer position still requires a live session.
