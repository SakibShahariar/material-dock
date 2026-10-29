# GSettings reference

Schema ID: `org.gnome.shell.extensions.material-dock`

This reference documents all **29 keys** currently declared in `schemas/org.gnome.shell.extensions.material-dock.gschema.xml`. Defaults and allowed values must be kept in sync with that schema when settings are added or changed.

Types: `boolean` is true/false, `integer` is a whole number, `double` is a decimal number, `string` is text, and `string array` is a list of strings.

| Key | Type | Default | Effect | Allowed values / range |
| --- | --- | --- | --- | --- |
| `icon-size` | integer | 48 | Pixel size of dock icons. | 16–128 |
| `running-indicator` | string | 'dots' | How running apps are marked. | 'none', 'dots', 'bars' |
| `magnify-enabled` | boolean | true | Enable icon magnification on hover. | true / false |
| `magnify-effect` | string | 'zoom' | Magnification style; wave also scales neighboring icons. | 'off', 'zoom', 'wave' |
| `magnify-scale` | double | 1.25 | Maximum magnification scale. | 1.0–3.0 |
| `magnify-range` | integer | 2 | Number of neighboring icons affected by wave magnification. | 0–5 |
| `dock-position` | string | 'bottom' | Screen edge where the dock is placed. | 'top', 'bottom' |
| `dock-alignment` | string | 'center' | Alignment along the selected edge. | 'start', 'center', 'end' |
| `dock-margin` | integer | 4 | Distance from the screen edge, in pixels. | 0–200 |
| `dock-fixed` | boolean | false | Reserve screen space so windows do not overlap the dock; intended for Never hide mode. | true / false |
| `autohide-mode` | string | 'intelligent' | Visibility policy for the dock. | 'never', 'always', 'intelligent' |
| `autohide-timeout` | integer | 300 | Delay before the dock hides, in milliseconds. | 0–5000 |
| `click-action` | string | 'focus-or-minimize' | Action when clicking a running app icon. | 'focus', 'focus-or-minimize', 'toggle-minimize', 'cycle-windows', 'previews', 'launch' |
| `middle-click-action` | string | 'new-window' | Action when middle-clicking an app icon. | 'new-window', 'activate' |
| `scroll-action` | string | 'cycle-windows' | Action when scrolling over an app icon. | 'cycle-windows', 'switch-workspace', 'nothing' |
| `show-favorites` | boolean | true | Keep favorite apps visible when they are not running. | true / false |
| `show-running` | boolean | true | Show apps that currently have open windows. | true / false |
| `show-show-apps-button` | boolean | true | Show the button that opens the applications grid. | true / false |
| `show-desktop-button` | boolean | true | Show the dock's Show Desktop button independently of other dock content. | true / false |
| `hide-in-overview` | boolean | false | Hide the dock while Activities Overview is open. | true / false |
| `hide-in-fullscreen` | boolean | false | Hide the dock on a monitor with a fullscreen window. | true / false |
| `current-workspace-only` | boolean | false | Limit running-app icons to the active workspace; favorites remain available. | true / false |
| `show-minimized-tiles` | boolean | true | Show minimized windows as separate dock tiles. | true / false |
| `show-previews` | boolean | true | Show a preview panel when hovering an app icon. | true / false |
| `auto-fit-icons` | boolean | true | Shrink icons automatically when the dock would overflow available space. | true / false |
| `folder-stacks` | string array | [] | Absolute folder paths pinned to the dock. | Array of directory paths |
| `folder-sort` | string | `'modified'` | Sort files inside folder stacks. | `'name'`, `'modified'`, `'type'` |
| `app-groups` | string array | [] | App groups in the format Label|id1,id2,id3. | Array of group definitions |
| `monitor-index` | integer | -1 | Monitor selected for the dock; -1 means the primary monitor. | -1 or a monitor index |

## Read and change settings

Run these commands in the same user session where Material Dock is installed:

```sh
SCHEMA=org.gnome.shell.extensions.material-dock
gsettings list-keys "$SCHEMA"
gsettings get "$SCHEMA" dock-position
gsettings set "$SCHEMA" dock-position "'top'"
gsettings reset "$SCHEMA" dock-position
```

Use values from the table. String values need GVariant string quoting, booleans use `true` or `false`, and arrays use GVariant array syntax. For example, to pin a folder, set `folder-stacks` to an array containing its absolute path; to define an app group, use the `Label|id1,id2,id3` format described above. The Preferences window is the recommended way to edit these settings.

To restore a key to its schema default, use `gsettings reset` with that key. This affects only the selected setting; resetting `folder-stacks` or `app-groups` removes the custom entries stored in that setting.

## Maintenance

When adding or changing a GSettings key, update this table and the schema together. Verify key names, types, defaults, choices, and numeric ranges against the XML schema rather than copying values from memory.
