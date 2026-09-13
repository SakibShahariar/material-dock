#!/usr/bin/env bash
set -euo pipefail

UUID="material-dock@SakibShahariar"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/$UUID"

echo "Installing $UUID -> $DEST"
rm -rf "$DEST"
mkdir -p "$DEST/schemas" "$DEST/lib"

cp "$SRC"/metadata.json "$SRC"/extension.js "$SRC"/prefs.js "$SRC"/stylesheet.css "$DEST/"
cp "$SRC"/schemas/*.xml "$DEST/schemas/"
cp "$SRC"/lib/*.js "$DEST/lib/"

glib-compile-schemas "$DEST/schemas/"

# Allow the current session to discover the extension
busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval \
  'global.reexec_self();' 2>/dev/null || true

if command -v gnome-extensions >/dev/null 2>&1; then
    gnome-extensions enable "$UUID" 2>/dev/null || echo "Install done. Enable with: gnome-extensions enable $UUID"
else
    echo "Install done. Enable with: gnome-extensions enable $UUID"
fi