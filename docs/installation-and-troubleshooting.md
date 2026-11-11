# Installation, updates, and troubleshooting

This guide describes the installation behavior implemented by this repository. It deliberately distinguishes declared compatibility from compatibility exercised in a live GNOME Shell session.

## Compatibility status

- **Declared minimum:** GNOME Shell 47. The extension metadata currently lists GNOME Shell 47, 48, 49, and 50.
- **Runtime-tested versions:** No version-specific live-session test results are recorded in this repository yet. Issue [#18](https://github.com/SakibShahariar/material-dock/issues/18) tracks validation of the declared versions.
- **GNOME Shell 51:** Not declared as supported. Its compatibility audit is tracked in [#75](https://github.com/SakibShahariar/material-dock/issues/75).
- **Wayland and X11:** Neither session type currently has a completed, recorded end-to-end compatibility matrix. Treat both as **not yet runtime-verified**. The install script notes that a Wayland logout/login may be needed for GNOME Shell to discover a newly installed extension; this is an installation caveat, not proof of Wayland compatibility.

The metadata list is a declared compatibility range, not a guarantee that every feature has been tested on every version. See the [GNOME Shell smoke-test checklist](gnome-smoke-test.md) and [Wayland validation matrix](wayland-validation-matrix.md) before making a runtime support claim.

## Requirements

- A GNOME Shell session.
- The GLib schema compiler (`glib-compile-schemas`) to install or compile the extension schema.
- `gnome-extensions` to enable or disable the extension from the command line.
- Node.js 20 or newer only if you want to run the repository's automated Node.js tests.

## Install from a checkout

From the repository directory:

```sh
./install.sh
```

The script stages the extension under the user's GNOME extensions directory, compiles the GSettings schema, and then replaces the installed directory. It attempts to enable the extension if `gnome-extensions` is available.

There is not yet a published release archive or GNOME Extensions listing. Until the first release is published, install from a source checkout using the script above. Track release packaging in [issue #107](https://github.com/SakibShahariar/material-dock/issues/107).

For a new installation on Wayland, log out and back in if the extension does not appear. Then enable it:

```sh
gnome-extensions enable material-dock@SakibShahariar
```

### Manual installation

```sh
UUID=material-dock@SakibShahariar
DEST="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/$UUID"
mkdir -p "$DEST/schemas" "$DEST/lib"
cp metadata.json extension.js prefs.js \
    stylesheet.css stylesheet-dark.css stylesheet-light.css "$DEST/"
cp schemas/*.xml "$DEST/schemas/"
cp lib/*.js "$DEST/lib/"
glib-compile-schemas "$DEST/schemas/"
gnome-extensions enable "$UUID"
```

## Update

Update the checkout to the revision you want, then run `./install.sh` again from the repository directory. The installer stages the new files and only replaces the existing extension directory after schema compilation succeeds.

If GNOME Shell continues to show the previous code, disable and re-enable the extension or log out and back in:

```sh
gnome-extensions disable material-dock@SakibShahariar
gnome-extensions enable material-dock@SakibShahariar
```

## Disable and uninstall

Disable the extension:

```sh
gnome-extensions disable material-dock@SakibShahariar
```

Remove the installed extension files:

```sh
rm -rf "${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/material-dock@SakibShahariar"
```

Uninstalling the extension directory does not remove the user's GNOME Shell settings. To remove those settings as well, use the reset command below before or after uninstalling.

## Reset preferences

Resetting settings removes Material Dock preferences, including pinned folder paths, app groups, and appearance/behavior choices. It does not delete the folders or files referenced by those settings.

```sh
gsettings reset-recursively org.gnome.shell.extensions.material-dock
```

## Troubleshooting

### The dock does not appear

1. Confirm that the installed GNOME Shell version is in the metadata-declared range (47–50); remember that this range is not yet fully runtime-verified.
2. Check the extension state:
   ```sh
   gnome-extensions info material-dock@SakibShahariar
   ```
3. Enable it if disabled:
   ```sh
   gnome-extensions enable material-dock@SakibShahariar
   ```
4. On Wayland, log out and back in after a new installation.
5. Check the session log using the command in the [diagnostics section](#collect-diagnostic-information).

### Preferences do not open or settings appear missing

Confirm that the schema exists in the installed extension directory and compile it again if necessary:

```sh
glib-compile-schemas "${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/material-dock@SakibShahariar/schemas"
```

Then try opening Preferences again. Include any schema or extension error from the session log when reporting the problem.

### Autohide or intellihide behaves unexpectedly

Check the selected autohide mode, timeout, fullscreen/Overview visibility options, monitor selection, and whether a window overlaps the dock. Record the GNOME Shell version, session type, monitor layout, and exact steps. These behaviors require a live session; Node.js tests alone cannot verify compositor/window geometry behavior.

### GNOME Shell version is not listed

Do not add a version to `metadata.json` based only on static checks. Run the version-specific smoke tests and record the results first. GNOME Shell 51 is not currently declared supported.

## Collect diagnostic information

Run:

```sh
gnome-shell --version
gnome-extensions info material-dock@SakibShahariar
journalctl -b -o cat | grep -iE 'material-dock|gnome-shell|mutter'
```

When sharing logs, include only the relevant error lines and remove unrelated personal information, filenames, or other private details.

## Desktop data and local storage

Material Dock uses GNOME Shell APIs to read local desktop state needed to render and operate the dock, including installed/running applications, their windows, focus and urgency state, workspace membership, monitor information, and the user's configured dock preferences.

When a user opens a folder stack, the extension enumerates that configured folder to display non-hidden file entries and their local metadata (such as names, sizes, modification times, content types, and icons). It opens selected files or folders through the desktop's default application handlers.

Preferences are stored locally through the GSettings schema `org.gnome.shell.extensions.material-dock`. This includes settings such as pinned folder paths and app-group definitions. The repository does not implement an account system, cloud synchronization, or a telemetry upload service. The project has no documented remote collection of the desktop or folder information described above.
