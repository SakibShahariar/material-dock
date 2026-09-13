# Material Dock — a GNOME Shell dock

A highly customizable dock for GNOME Shell (47+), designed as a from-scratch
replacement for *Dash to Dock* with more controls, inspired by the OmaDock
Quickshell dock for Omarchy/Hyprland.

## Features

- **Window preview tiles** — hovering an app icon shows a panel with one
  clickable card per window (title + icon). Minimized windows appear as
  compact tiles on the dock itself, click to restore.
- **Magnification** — `zoom` (grow in place) and `wave` (grow neighbors too)
  effects with configurable scale and range.
- **Intelligent autohide** — `never`, `always`, or `intelligent` (hides only
  when a window actually overlaps the dock), with configurable hide delay and
  a reveal strip at the screen edge.
- **Minimize-on-click** — `focus-or-minimize` (OmaDock "active" mode: clicking
  a focused app parks it), `toggle-minimize`, `cycle-windows`, `previews`, and
  more.
- **Folder stacks** — pin folders to the dock; clicking opens a popover with
  the newest files (name, size, relative time), click to open.
- **App groups** — group apps into a single tile with a live multi-icon; click
  to pick and launch/focus.
- **Deep settings UI** — Adw preferences window (Behavior / Appearance /
  Position / Extras) plus a right-click dock menu for fast toggles.

## Install

```sh
./install.sh
```

or manually:

```sh
UUID=material-dock@SakibShahariar
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
mkdir -p "$DEST/schemas" "$DEST/lib"
cp metadata.json extension.js prefs.js stylesheet.css "$DEST/"
cp schemas/*.xml "$DEST/schemas/"
cp lib/*.js "$DEST/lib/"
glib-compile-schemas "$DEST/schemas/"
gnome-extensions enable "$UUID"
```

## Development

Symlink the folder into the extensions dir so edits apply immediately:

```sh
ln -s "$PWD" ~/.local/share/gnome-shell/extensions/material-dock@SakibShahariar
glib-compile-schemas schemas/
```

then restart the shell (`alt+f2` → `r`) or re-enable the extension to pick up
changes. Log errors with:

```sh
journalctl -f -o cat | grep -i material-dock
```

## Layout

```
extension.js            entry point
prefs.js                Adw preferences window
lib/manager.js          dock lifecycle, monitor selection
lib/dock.js             dock container, chrome, positioning, autohide
lib/dash.js             icon container + dash fork (click/scroll semantics)
lib/indicators.js       running/focused/urgent indicators
lib/magnifier.js        zoom/wave magnification
lib/intellihide.js      overlap-based intelligent autohide
lib/previews.js         hover window previews + minimized tiles
lib/stacks.js           folder stacks + app group tiles
lib/contextmenu.js      right-click dock menu
lib/utils.js            helpers
schemas/                GSettings schema
stylesheet.css          dock styling
```

## Notes

- Only the bottom and top screen edges are supported for now (left/right docks
  can be added later).
- Windows are minimized with the usual `Meta.Window.minimize()` API, which
  works on both X11 and Wayland.

## License

Based on GNOME Shell's `ui/dash.js` (GPL-2.0-or-later, copyright GNOME Shell
contributors). See the `dash.js` file header.