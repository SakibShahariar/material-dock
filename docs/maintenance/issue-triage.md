# Open issue triage

Last reviewed: 2026-11-03
Default branch: `main`
Open issues at review: 31

Categories describe what can be implemented and verified without the owner's laptop or a live GNOME session. They are not severity or priority labels. Reclassify an issue when implementation, CI, dependencies, environment access, or owner decisions change.

## Summary

| Category | Count | Meaning |
|---|---:|---|
| A — Fully actionable | 0 | No remaining issue can currently be completed and fully verified without GNOME/runtime validation or an owner decision. |
| B — Implementation ready, validation pending | 28 | Implementation can proceed; final acceptance needs GNOME/runtime validation or the owner's PC/release approval. Subgroups below separate independent work, runtime validation, dependencies, and owner validation. |
| C — Environment-dependent | 2 | Progress or reliable acceptance depends on a GNOME version/session or visual capture environment that is not currently available. |
| D — Blocked by external dependencies | 1 | Requires an external provider/integration not supplied by this repository. |
| E — Needs the owner's decision or information | 0 | No unresolved owner decision remains; #107 is awaiting the owner's own PC testing and release approval, so it is tracked in B4. |

## Category A — Fully actionable

_No open issue currently meets this standard. Do not force issues into A merely because a unit test can be written; the remaining acceptance criteria must also be verifiable._

## Category B — Implementation ready, validation pending

### B1 — Independent implementation work (10)

These issues can be developed independently of the side-dock architecture. Their acceptance criteria still need to be met before closure.

| Issue | Implementation focus |
|---|---|
| [#62 — Keyboard navigation for dock items](https://github.com/SakibShahariar/material-dock/issues/62) | Focus model, activation, and visible focus state. |
| [#63 — Keyboard-accessible context menus](https://github.com/SakibShahariar/material-dock/issues/63) | Menu-key/Shift+F10 invocation and focus restoration. |
| [#64 — Accessible running, focused, and urgent states](https://github.com/SakibShahariar/material-dock/issues/64) | Accessible state descriptions and updates. |
| [#74 — Dock spacing and density controls](https://github.com/SakibShahariar/material-dock/issues/74) | Configurable spacing and stable auto-fit. |
| [#83 — Preview keyboard navigation and Escape handling](https://github.com/SakibShahariar/material-dock/issues/83) | Preview focus, activation, close, and Escape behavior. |
| [#96 — Group previews by workspace and offer window actions](https://github.com/SakibShahariar/material-dock/issues/96) | Workspace grouping and safe window actions. |
| [#98 — Pin files and per-file folder-stack actions](https://github.com/SakibShahariar/material-dock/issues/98) | File pinning and safe per-file actions. |
| [#99 — Gettext infrastructure and translation guide](https://github.com/SakibShahariar/material-dock/issues/99) | Translation extraction, catalogs, packaging, and guide. |
| [#100 — Keyboard shortcuts for dock actions](https://github.com/SakibShahariar/material-dock/issues/100) | Shortcut schema, conflict handling, and cleanup. |
| [#101 — Dock settings backup and restore](https://github.com/SakibShahariar/material-dock/issues/101) | Validated configuration export/import and recovery. |

### B2 — Implementation with GNOME/runtime validation (9)

Implementation and automated coverage can proceed, but final acceptance requires visual, interactive, accessibility, or target-session checks.

| Issue | Current work / remaining validation |
|---|---|
| [#8 — Recheck intellihide after window geometry and overlap changes](https://github.com/SakibShahariar/material-dock/issues/8) | Audit signal/coalescing logic and add deterministic geometry tests; final window movement, resize, workspace, and monitor behavior needs a live session. |
| [#30 — Verify API usage in context menu, stack popovers and group icon grid](https://github.com/SakibShahariar/material-dock/issues/30) | Static source review finds the reported API/grid/manager/position concerns already corrected; verify outside-click dismissal, popup placement, and group grid rendering in GNOME. |
| [#35 — Window previews: live thumbnails, close button, and middle-click to close](https://github.com/SakibShahariar/material-dock/issues/35) | Implementation can be developed against supported Shell APIs with focused tests where possible; live Mutter actor/thumbnail and window-close behavior needs GNOME validation. |
| [#59 — Empty state when no dock content is eligible](https://github.com/SakibShahariar/material-dock/issues/59) | The empty-state helper, dock integration, and unit tests already exist; verify visual layout, dismissal, and content restoration in GNOME before closure. |
| [#66 — File drag-and-drop actions for folder stacks](https://github.com/SakibShahariar/material-dock/issues/66) | Implement safe drop handling and operation feedback; verify drag/drop gestures and confirmation UI in GNOME. |
| [#68 — Optional multi-window indicator](https://github.com/SakibShahariar/material-dock/issues/68) | Existing dots/bars already reflect window count; correct eligibility under workspace filtering and verify live window transitions. |
| [#70 — Synchronize monitor selection with display changes](https://github.com/SakibShahariar/material-dock/issues/70) | Implement monitor-change subscriptions and safe selection fallback; hotplug/reorder behavior needs a live multi-monitor session. |
| [#73 — Dock opacity and backdrop controls](https://github.com/SakibShahariar/material-dock/issues/73) | Implement settings/theme behavior and contrast safeguards; inspect readability and compositor effects in GNOME. |
| [#87 — Context-menu icons and accessible roles](https://github.com/SakibShahariar/material-dock/issues/87) | Add icons and explicit accessible semantics to actionable menu entries; inspect appearance and screen-reader output in GNOME. |

### B3 — Dependent feature work (6)

Treat these as a connected side-dock project rather than unrelated fixes.

| Issue | Dependency / implementation order |
|---|---|
| [#72 — Adaptive auto-fit constraints](https://github.com/SakibShahariar/material-dock/issues/72) | Integrate orientation-aware constraints with the side-dock geometry work. |
| [#91 — Left and right dock edges](https://github.com/SakibShahariar/material-dock/issues/91) | Parent feature for side-dock support. |
| [#92 — Side-dock geometry, auto-fit and reveal strip](https://github.com/SakibShahariar/material-dock/issues/92) | Builds on #91. |
| [#93 — Side-dock magnification, previews, menus and keyboard interaction](https://github.com/SakibShahariar/material-dock/issues/93) | Builds on #91 and #92 geometry. |
| [#94 — Side-dock intellihide and multi-monitor behavior](https://github.com/SakibShahariar/material-dock/issues/94) | Builds on #91 and monitor lifecycle work. |
| [#95 — Independent docks on multiple monitors](https://github.com/SakibShahariar/material-dock/issues/95) | Requires a deliberate per-monitor ownership/settings architecture. |

### B4 — Owner validation and compatibility gate (3)

| Issue | Remaining gate |
|---|---|
| [#38 — GNOME 51 metadata support](https://github.com/SakibShahariar/material-dock/issues/38) | Static API audit can proceed; do not declare GNOME 51 support until a real GNOME 51 smoke test. |
| [#75 — GNOME Shell 51 compatibility audit](https://github.com/SakibShahariar/material-dock/issues/75) | Audit source/API changes now; final compatibility claim requires GNOME 51 validation. |
| [#107 — Publish the first tagged extension archive](https://github.com/SakibShahariar/material-dock/issues/107) | Prepare release readiness if useful, but do not tag or publish until the owner has tested Material Dock on their PC and explicitly approves release. |

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

_No open issue currently requires an additional owner decision. #107 is awaiting the owner's PC validation and explicit release approval; it is tracked in B4, not E._

## Reassessment notes

- #30: current source contains a `PopupMenuManager` for the dock context menu and folder popovers; popup placement follows top/bottom dock position; menus use the normal `.open()` call; group icon children are positioned with `GridLayout.attach()`; autohide selection uses stored values rather than matching label text. These source facts do not replace the required GNOME smoke test.
- #59: `lib/empty-state.js`, `lib/dock.js`, and `tests/empty-state.test.js` already contain the helper, UI integration, and deterministic unit coverage. Keep open until visual/runtime acceptance is observed.
- #72: current layout code has removed the previously cited fixed 48 px reserve and 120 px minimum-width assumptions for horizontal auto-fit; it uses monitor edge margins plus magnification reserve. Vertical orientation remains unsupported until the side-dock work is implemented.
- Do not close Category B issues merely because source work is complete. The owner currently cannot provide a live GNOME session for final validation.
