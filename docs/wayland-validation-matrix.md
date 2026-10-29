# Wayland validation matrix

Use this matrix for release checks on a real GNOME Shell Wayland session. It supplements the [GNOME Shell smoke-test checklist](gnome-smoke-test.md); it does not replace version-specific API checks. Node tests and CI static checks cannot verify compositor behavior.

## Record the test environment

Copy this block once per GNOME Shell version and hardware/display configuration:

```text
Date:
Material Dock commit:
GNOME Shell version:
Distribution/version:
Session: Wayland
Display/GPU:
Monitor count and resolutions:
Fractional scaling (per monitor):
Dock edge and selected monitor:
Result: PASS / FAIL / BLOCKED
Shell journal errors:
```

Record actual values; do not infer compatibility from the extension metadata alone.

## Repeatable matrix

Run the baseline with the dock enabled, then repeat relevant cases after disabling and re-enabling the extension.

| ID | Setup / action | Expected result | If it fails, inspect |
| --- | --- | --- | --- |
| W-01 | One monitor at 100% scaling; enable the extension and open Preferences. | Dock and preferences appear; no Shell errors. | Extension enable logs, metadata, schema compilation. |
| W-02 | Two monitors with different resolutions; select primary, then secondary monitor in Preferences. | Dock stays on the selected display; placement is within that monitor's work area. | Saved monitor index, monitor enumeration, manager/dock geometry. |
| W-03 | Set fractional scaling where supported (for example 125% or 150%); repeat W-01 and W-02. | Dock, icons, reveal strip, and menus remain visible and correctly aligned. | Logical versus physical coordinates, scale factor assumptions, work-area calculations. |
| W-04 | While Preferences is open, connect or disconnect a monitor. | Monitor choices refresh; removed selections fall back safely without a stale index. | Display monitor-change signals and settings synchronization. |
| W-05 | Reorder displays or change which monitor is primary, then reopen Preferences and toggle the extension. | Dock follows the configured selection and does not create duplicate actors. | Monitor identity versus index assumptions; enable/disable cleanup. |
| W-06 | Open, move, resize, maximize, unmaximize, and close windows that overlap the dock. | Intelligent autohide follows overlap changes without getting stuck. | Window geometry/workspace signals, pending timeout cleanup, overlap calculations. |
| W-07 | Enter fullscreen on the dock's monitor, leave fullscreen, and repeat on another monitor. | The configured fullscreen visibility behavior applies to the correct monitor and restores afterward. | Fullscreen signals, monitor ownership, stale hidden state. |
| W-08 | Move the pointer over the reveal strip, reverse direction during animation, and move away. | Reveal/hide follows the latest pointer state without flicker or a stuck dock. | Pointer tracking, animation cancellation, autohide timers. |
| W-09 | Hover an app with several windows; move from icon to preview, rapidly switch icons, then close the previewed window. | Preview remains open across the pointer corridor, updates to the intended app, and closes safely. | Polling source duplication, preview destruction, pointer-corridor geometry, window close signals. |
| W-10 | Open a folder stack with many files; dismiss it during loading. Open and dismiss an app group. | Popovers dismiss correctly; delayed callbacks stop and the Shell remains responsive. | Enumeration cancellation, signal/timer teardown, popup manager registration. |
| W-11 | Change the Matugen palette or temporarily make it unavailable; restart or reload the extension. | Valid palette colors are used when available and fallback colors are used when absent; no stale palette is retained. | Theme file monitoring, parse failures, fallback color selection. |
| W-12 | Disable and re-enable the extension several times; log out/in if needed. | No duplicate dock, stale actors, continuing polling, or repeated extension errors. | Every registered signal, timeout, pointer watch, and actor teardown path. |

## Commands for evidence

Run these from the repository checkout after reproducing a failure:

```sh
git rev-parse HEAD
gnome-shell --version
gnome-extensions info material-dock@SakibShahariar
journalctl -b -o cat | grep -iE 'material-dock|gnome-shell|mutter'
```

Capture relevant output and the exact matrix ID. If a command is unavailable on the distribution, record that rather than treating it as a pass. Avoid attaching logs containing unrelated private data.

## Result log

Copy this row for every tested case and every Shell version:

| Shell version | Matrix ID | Result | Evidence / journal excerpt | Follow-up issue |
| --- | --- | --- | --- | --- |
|  |  | PASS / FAIL / BLOCKED |  |  |

A **PASS** means the behavior was exercised in that live session. A **BLOCKED** result means the environment or hardware was unavailable. Static checks alone must never be recorded as a live-session pass.
