# Material Dock

A customizable dock replacement for GNOME Shell, inspired by OmaDock for Omarchy/Hyprland. Material Dock brings app launching, window management, and workspace controls together in a configurable top- or bottom-edge dock.

[![CI](https://github.com/SakibShahariar/material-dock/actions/workflows/ci.yml/badge.svg)](https://github.com/SakibShahariar/material-dock/actions/workflows/ci.yml)
[![Validate](https://github.com/SakibShahariar/material-dock/actions/workflows/validate.yml/badge.svg)](https://github.com/SakibShahariar/material-dock/actions/workflows/validate.yml)

## Features

- **Window previews** — hover an app to see its windows, activate one, or close it. Middle-click can close a window; minimized windows appear as dock tiles that restore on click. Live thumbnail previews are not implemented yet.
- **Zoom and wave effects** — magnify icons in place or extend the effect to neighboring icons.
- **Intelligent autohide** — hide when windows overlap the dock, with configurable delay and an edge reveal strip; choose never-hide or always-hide modes too.
- **Show Desktop** — use the dedicated desktop button or the dock context menu to minimize windows on the primary monitor and restore the windows tracked by that action.
- **Flexible app actions** — configure click-to-minimize, window cycling, previews, and middle-click behavior.
- **Workspace filtering** — optionally show running apps from the current workspace while keeping favorites available.
- **Folder stacks and app groups** — open a folder’s recent files from a stack, or combine apps into a single tile with a multi-icon view.
- **Preferences and quick controls** — configure behavior, appearance, position, and extras in the Adwaita preferences window; use the right-click menu for common actions.
- **Visibility controls** — optionally hide the dock in Activities Overview or while a fullscreen window occupies its monitor.

## Compatibility

The extension metadata currently declares GNOME Shell **47, 48, 49, and 50**. Declared versions are not a guarantee of complete runtime verification: GNOME Shell APIs and behavior must be checked in a real session. See the [GNOME session smoke-test checklist](docs/gnome-smoke-test.md).

Only the **top and bottom** screen edges are supported at present.

## Install

From the repository directory, run:

```sh
./install.sh
```

The installer compiles the GSettings schema and installs the extension under `~/.local/share/gnome-shell/extensions/`. It attempts to enable the extension when `gnome-extensions` is available.

If a new installation does not appear in a Wayland session, log out and back in, then enable it from GNOME Extensions or run:

```sh
gnome-extensions enable material-dock@SakibShahariar
```

### Manual installation

If you prefer to install without the script:

```sh
UUID=material-dock@SakibShahariar
DEST="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/$UUID"
mkdir -p "$DEST/schemas" "$DEST/lib"
cp metadata.json extension.js prefs.js stylesheet.css "$DEST/"
cp schemas/*.xml "$DEST/schemas/"
cp lib/*.js "$DEST/lib/"
glib-compile-schemas "$DEST/schemas/"
gnome-extensions enable "$UUID"
```

## Development and tests

Requirements: Node.js 20 or newer for the unit-test suite, plus GNOME Shell and its development tools for live integration checks.

Run automated tests and syntax checks:

```sh
npm test
```

For an editable local checkout, link the repository into the extensions directory and compile its schema:

```sh
ln -s "$PWD" "${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/material-dock@SakibShahariar"
glib-compile-schemas schemas/
```

Re-enable the extension after changing files. The `Alt+F2` → `r` restart is available only on X11; on Wayland, log out and back in or use a nested `gnome-shell --devkit` session. To follow extension-related log messages:

```sh
journalctl -f -o cat | grep -i material-dock
```

**Important:** Node tests and CI static checks do not load GNOME Shell, Mutter, or libadwaita. Before claiming runtime compatibility for a Shell version, work through [the smoke-test checklist](docs/gnome-smoke-test.md) in a real session.

## Project layout

| Path | Purpose |
| --- | --- |
| `extension.js` | Extension entry point |
| `prefs.js` | Adwaita preferences |
| `lib/manager.js` | Lifecycle and monitor selection |
| `lib/dock.js` | Dock container, position, and autohide |
| `lib/dash.js` | App icon container and click/scroll behavior |
| `lib/indicators.js` | Running, focused, and urgent indicators |
| `lib/magnifier.js` | Zoom and wave effects |
| `lib/intellihide.js` | Window-overlap visibility logic |
| `lib/previews.js` | Window previews and minimized tiles |
| `lib/stacks.js` | Folder stacks and app groups |
| `lib/contextmenu.js` | Dock context menu |
| `schemas/` | GSettings schema |
| `stylesheet.css` | Dock styling |

## License and attribution

Material Dock is licensed under [GPL-2.0-or-later](LICENSE).

`lib/dash.js` is based on GNOME Shell's `ui/dash.js` and retains its upstream GPL licensing and contributor attribution in the file header. Material Dock modifies that code and is **not an official GNOME Shell project**.
