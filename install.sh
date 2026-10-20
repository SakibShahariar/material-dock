#!/usr/bin/env bash
set -euo pipefail

UUID="material-dock@SakibShahariar"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSIONS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions"
DEST="$EXTENSIONS_DIR/$UUID"

echo "Installing $UUID -> $DEST"

# Stage on the same filesystem as DEST so the final rename is atomic.
mkdir -p "$EXTENSIONS_DIR"
WORK_DIR="$(mktemp -d "$EXTENSIONS_DIR/.material-dock-install.XXXXXX")"
STAGED="$WORK_DIR/$UUID"
BACKUP="$WORK_DIR/$UUID.backup"
cleanup() {
    status=$?
    if [[ $status -ne 0 && -d "$BACKUP" && ! -e "$DEST" ]]; then
        rm -rf "$DEST"
        mv "$BACKUP" "$DEST"
        echo "Installation failed; restored previous installation." >&2
    fi
    rm -rf "$WORK_DIR"
    exit "$status"
}
trap cleanup EXIT

mkdir -p "$STAGED/schemas" "$STAGED/lib"
cp "$SRC/metadata.json" "$SRC/extension.js" "$SRC/prefs.js" "$SRC/stylesheet.css" "$STAGED/"
cp "$SRC"/schemas/*.xml "$STAGED/schemas/"
cp "$SRC"/lib/*.js "$STAGED/lib/"
glib-compile-schemas "$STAGED/schemas/"

# Preserve the current installation until the staged copy is complete.
if [[ -e "$DEST" ]]; then
    mv "$DEST" "$BACKUP"
fi

mv "$STAGED" "$DEST"
rm -rf "$BACKUP"

# GNOME Shell Eval is unavailable in normal sessions. On Wayland, a
# logout/login may be needed for the session to discover a newly installed extension.
if [[ "${XDG_SESSION_TYPE:-}" == "wayland" ]]; then
    echo "On Wayland, log out and back in if the newly installed extension does not appear."
fi

if command -v gnome-extensions >/dev/null 2>&1; then
    gnome-extensions enable "$UUID" 2>/dev/null || echo "Install done. Enable with: gnome-extensions enable $UUID"
else
    echo "Install done. Enable with: gnome-extensions enable $UUID"
fi