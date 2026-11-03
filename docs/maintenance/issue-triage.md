# Open issue triage

Last reviewed: 2026-11-03
Default branch: `main`
Open issues at review: 31

Categories describe what can be implemented and verified without the owner's laptop or a live GNOME session. They are not severity or priority labels. Reclassify an issue when implementation, CI, dependencies, environment access, or owner decisions change.

## Summary

| Category | Count | Meaning |
|---|---:|---|
| A — Fully actionable | 0 | No remaining issue can currently be completed and fully verified without GNOME/runtime validation or an owner decision. |
| B — Implementation ready, validation pending | 27 | Source implementation and automated tests can proceed; final acceptance needs a live GNOME session, visual/accessibility inspection, or target-environment verification. |
| C — Environment-dependent | 2 | Progress or reliable acceptance depends on a GNOME version/session or visual capture environment that is not currently available. |
| D — Blocked by external dependencies | 1 | Requires an external provider/integration not supplied by this repository. |
| E — Needs the owner's decision or information | 1 | A release version and explicit publication approval are needed. |

## Category A — Fully actionable

_No open issue currently meets this standard. Do not force issues into A merely because a unit test can be written; the remaining acceptance criteria must also be verifiable._

## Category B — Implementation ready, validation pending

| Issue | Current work / remaining validation |
|---|---|
| [#8 — Recheck intellihide after window geometry and overlap changes](https://github.com/SakibShahariar/material-dock/issues/8) | Audit signal/coalescing logic and add deterministic geometry tests; final window movement, resize, workspace, and monitor behavior needs a live session. |
| [#30 — Verify API usage in context menu, stack popovers and group icon grid](https://github.com/SakibShahariar/material-dock/issues/30) | Static source review finds the reported API/grid/manager/position concerns already corrected; verify outside-click dismissal, popup placement, and group grid rendering in GNOME. |
| [#35 — Window previews: live thumbnails, close button, and middle-click to close](https://github.com/SakibShahariar/material-dock/issues/35) | Implementation can be developed against supported Shell APIs with focused tests where possible; live Mutter actor/thumbnail and window-close behavior needs GNOME validation. |
| [#38 — GNOME 51 metadata support](https://github.com/SakibShahariar/material-dock/issues/38) | Audit source/API compatibility and prepare metadata change; only add GNOME 51 to the declared range after a real GNOME 51 smoke test. |
| [#59 — Empty state when no dock content is eligible](https://github.com/SakibShahariar/material-dock/issues/59) | The empty-state helper, dock integration, and unit tests already exist; verify visual layout, dismissal, and content restoration in GNOME before closure. |
| [#62 — Keyboard navigation for dock items](https://github.com/SakibShahariar/material-dock/issues/62) | Implement/test focus movement and activation; final focus visibility and restoration need visual and keyboard validation in GNOME. |
| [#63 — Keyboard-accessible context menus](https://github.com/SakibShahariar/material-dock/issues/63) | Implement Menu/Shift+F10 invocation and focus lifecycle; verify keyboard behavior and focus restoration in a live session. |
| [#64 — Accessible running, focused, and urgent states](https://github.com/SakibShahariar/material-dock/issues/64) | Add accessible descriptions and state tests; screen-reader announcement behavior needs live accessibility validation. |
| [#66 — File drag-and-drop actions for folder stacks](https://github.com/SakibShahariar/material-dock/issues/66) | Implement safe drop handling and operation feedback; verify drag/drop gestures and confirmation UI in GNOME. |
| [#68 — Optional multi-window indicator](https://github.com/SakibShahariar/material-dock/issues/68) | Implement count/badge state and window/workspace tests; inspect visual states and real window transitions in GNOME. |
| [#70 — Synchronize monitor selection with display changes](https://github.com/SakibShahariar/material-dock/issues/70) | Implement monitor-change subscriptions and safe selection fallback; hotplug/reorder behavior needs a live multi-monitor session. |
| [#72 — Adaptive auto-fit constraints](https://github.com/SakibShahariar/material-dock/issues/72) | Current code derives horizontal available width from monitor margins and magnification reserve and has pure layout tests; orientation-aware/vertical behavior remains tied to side-dock work and needs geometry/runtime validation. |
| [#73 — Dock opacity and backdrop controls](https://github.com/SakibShahariar/material-dock/issues/73) | Implement settings/theme behavior and contrast safeguards; inspect readability and compositor effects in GNOME. |
| [#74 — Dock spacing and density controls](https://github.com/SakibShahariar/material-dock/issues/74) | Implement spacing/preset calculations and tests; verify density and magnification layout visually. |
| [#75 — GNOME Shell 51 compatibility audit](https://github.com/SakibShahariar/material-dock/issues/75) | Audit changed APIs and tests; final compatibility claim requires a GNOME 51 session. |
| [#83 — Preview keyboard navigation and Escape handling](https://github.com/SakibShahariar/material-dock/issues/83) | Implement keyboard focus/navigation and event tests; verify focus, activation, and dismissal in GNOME. |
| [#87 — Context-menu icons and accessible roles](https://github.com/SakibShahariar/material-dock/issues/87) | Add consistent iconography and accessible names/roles; verify menu appearance and screen-reader output in GNOME. |
| [#91 — Left and right dock edges](https://github.com/SakibShahariar/material-dock/issues/91) | Large implementation spanning geometry, overlays, visibility, preferences, and monitor behavior; automated geometry tests plus live side-dock smoke tests required. |
| [#92 — Side-dock geometry, auto-fit and reveal strip](https://github.com/SakibShahariar/material-dock/issues/92) | Implement vertical geometry and height-based auto-fit; validate scaling, small displays, and reveal strip interaction live. |
| [#93 — Side-dock magnification, previews, menus and keyboard interaction](https://github.com/SakibShahariar/material-dock/issues/93) | Implement orientation-aware overlays and input behavior; validate placement and keyboard interaction on both side edges. |
| [#94 — Side-dock intellihide and multi-monitor behavior](https://github.com/SakibShahariar/material-dock/issues/94) | Implement lifecycle and monitor handling with tests; verify side-edge overlap, hotplug, and visibility live. |
| [#95 — Independent docks on multiple monitors](https://github.com/SakibShahariar/material-dock/issues/95) | Implement per-monitor ownership/settings and cleanup; multi-monitor hotplug and visibility require target-session validation. |
| [#96 — Group previews by workspace and offer window actions](https://github.com/SakibShahariar/material-dock/issues/96) | Implement grouping/actions and state tests; verify workspace transitions, focus, and menu behavior in GNOME. |
| [#98 — Pin files and per-file folder-stack actions](https://github.com/SakibShahariar/material-dock/issues/98) | Implement safe file actions and missing-file states; verify popover actions and non-blocking behavior in GNOME. |
| [#99 — Gettext infrastructure and translation guide](https://github.com/SakibShahariar/material-dock/issues/99) | Implement extraction/catalog packaging and automated checks; a non-English locale smoke test is still required. |
| [#100 — Keyboard shortcuts for dock actions](https://github.com/SakibShahariar/material-dock/issues/100) | Implement schema, conflict handling, and cleanup; validate shortcut registration/conflicts and monitor/workspace behavior in GNOME. |
| [#101 — Dock settings backup and restore](https://github.com/SakibShahariar/material-dock/issues/101) | Implement safe JSON export/import, schema validation, and tests; verify confirmation and recovery UX in GNOME. |

## Category C — Environment-dependent

| Issue | Missing environment / condition |
|---|---|
| [#18 — Validate compatibility against each declared GNOME Shell version](https://github.com/SakibShahariar/material-dock/issues/18) | Requires testing the full declared GNOME Shell 47–50 matrix in real sessions; those versioned environments are not available here. Static audits do not satisfy this issue. |
| [#108 — Screenshots and interaction demos](https://github.com/SakibShahariar/material-dock/issues/108) | Requires genuine, current extension screenshots/GIFs from a GNOME session and careful removal of personal system information. Do not fabricate product screenshots. |

## Category D — Blocked by external dependencies

| Issue | Dependency / unblock condition |
|---|---|
| [#40 — Progress badges on icons (suite signals)](https://github.com/SakibShahariar/material-dock/issues/40) | No provider/integration contract is identified in this repository. Revisit when a concrete external suite signal/API and at least one usable provider are available. |

## Category E — Needs the owner's decision or information

| Issue | Decision needed |
|---|---|
| [#107 — Publish the first tagged extension archive](https://github.com/SakibShahariar/material-dock/issues/107) | Confirm the initial release version (for example, `v0.1.0`) and explicitly authorize publishing a public GitHub release. Do not create a public release without that decision. |

## Reassessment notes

- #30: current source contains a `PopupMenuManager` for the dock context menu and folder popovers; popup placement follows top/bottom dock position; menus use the normal `.open()` call; group icon children are positioned with `GridLayout.attach()`; autohide selection uses stored values rather than matching label text. These source facts do not replace the required GNOME smoke test.
- #59: `lib/empty-state.js`, `lib/dock.js`, and `tests/empty-state.test.js` already contain the helper, UI integration, and deterministic unit coverage. Keep open until visual/runtime acceptance is observed.
- #72: current layout code has removed the previously cited fixed 48 px reserve and 120 px minimum-width assumptions for horizontal auto-fit; it uses monitor edge margins plus magnification reserve. Vertical orientation remains unsupported until the side-dock work is implemented.
- Do not close Category B issues merely because source work is complete. The owner currently cannot provide a live GNOME session for final validation.
