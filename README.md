# Material Dock

A customizable dock replacement for **GNOME Shell**. Launch apps, manage windows, switch workspaces, and keep your favorite actions close at hand—all from a dock that fits your desktop.

[![CI](https://github.com/SakibShahariar/material-dock/actions/workflows/ci.yml/badge.svg)](https://github.com/SakibShahariar/material-dock/actions/workflows/ci.yml)
[![Validate](https://github.com/SakibShahariar/material-dock/actions/workflows/validate.yml/badge.svg)](https://github.com/SakibShahariar/material-dock/actions/workflows/validate.yml)

## What it does

- **Window management** — Preview an app's open windows, switch between them, close windows, and restore minimized windows from the dock.
- **Expressive icons** — Use in-place zoom or a neighboring-icon wave effect.
- **Smart visibility** — Automatically hide when windows overlap the dock, with configurable delays and an edge reveal strip. Choose always-visible or always-hidden behavior too.
- **App and workspace controls** — Configure click and middle-click actions, cycle windows, filter running apps by workspace, and keep favorites accessible.
- **Folders and app groups** — Open recent files from folder stacks or combine related apps into a single dock item.
- **Desktop controls** — Show the desktop and optionally hide the dock in Activities Overview or when a fullscreen window is active.

Position the dock at the **top or bottom** edge and customize its behavior and appearance from the Adwaita preferences window. When `~/.config/matugen/matugen-colors.css` contains the required Material 3 color roles, Material Dock applies that palette to its surface, indicators, tiles, previews, labels, and controls. It watches the file for changes and falls back to the GNOME Shell theme when the Matugen palette is missing or incomplete.

## Compatibility

The extension metadata declares GNOME Shell **47–50**. This does not guarantee runtime compatibility on every version; GNOME Shell APIs and behavior need validation in a real desktop session. Live thumbnail previews are not implemented yet.

See the [GNOME session smoke-test checklist](docs/gnome-smoke-test.md) for validation status and test steps.

## Install

Clone the repository and run the installer:

```sh
git clone https://github.com/SakibShahariar/material-dock.git
cd material-dock
./install.sh
```

The installer compiles the GSettings schema and installs the extension in your user extensions directory. When available, it also attempts to enable the extension.

If it does not appear in a Wayland session after installation, log out and back in, then enable **Material Dock** in GNOME Extensions. You can also run:

```sh
gnome-extensions enable material-dock@SakibShahariar
```

For upgrades, removal, reset, and troubleshooting, see the [installation guide](docs/installation-and-troubleshooting.md).

## Documentation

- [Settings reference](docs/settings-reference.md) — every setting, default, and accepted value.
- [Installation and troubleshooting](docs/installation-and-troubleshooting.md)
- [GNOME session smoke tests](docs/gnome-smoke-test.md) — runtime validation checklist.
- [Test coverage](docs/test-coverage.md) — coverage baseline and scope.

## Development

Run the automated test suite (Node.js 20+):

```sh
npm test
```

These tests and CI checks do not run the extension inside GNOME Shell or Mutter. Verify runtime behavior in a real session before claiming compatibility; use the [smoke-test checklist](docs/gnome-smoke-test.md).

## License

Material Dock is licensed under [GPL-2.0-or-later](LICENSE).

`lib/dash.js` is based on GNOME Shell's `ui/dash.js` and retains its upstream licensing and contributor attribution in its file header. Material Dock is an independent project and is **not an official GNOME Shell project**.
