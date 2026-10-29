# Automated test coverage baseline

Baseline recorded from the GitHub Actions **CI** run for commit 8ed74aa69724a870feaa5b78c30d5996fdb09dd1 (https://github.com/SakibShahariar/material-dock/commit/8ed74aa69724a870feaa5b78c30d5996fdb09dd1), run 40870973032 (https://github.com/SakibShahariar/material-dock/actions/runs/40870973032), on 2026-10-29.

## Observed baseline

- Tests: **66 passed, 0 failed**
- Node test runner aggregate: **99.60% lines, 97.93% branches, 94.39% functions**

These percentages describe the JavaScript files loaded and instrumented by the current Node test suite, including test files. They are **not whole-repository coverage**: GNOME Shell integration modules that are not imported by tests do not appear in the report. Do not use the high aggregate as evidence that the extension has high end-to-end coverage.

The run reported 100% line, branch, and function coverage for the tested pure utility modules, including geometry, indicator state, layout, Matugen color parsing, pointer corridor, scrolling, Shell visibility decisions, visibility transitions, and workspace filtering. lib/show-desktop.js had 93.10% line and 91.67% branch coverage (uncovered lines 26–27); lib/signal-registry.js had 97.37% line and 90.00% branch coverage (uncovered line 16); lib/window-cycle.js had 100% line and 94.44% branch coverage.

## Critical modules not represented in the current coverage report

These modules are not directly imported by the current 13 test files and do not appear in the measured report:

| Module | Why it needs focused coverage |
| --- | --- |
| lib/dock.js | Dock actor creation, placement, and teardown |
| lib/dash.js | App icon interactions and event handling |
| lib/previews.js | Preview lifecycle, pointer polling, and window closure |
| lib/stacks.js | Folder enumeration, app-group popovers, and cleanup |
| lib/contextmenu.js | Popup lifecycle, dismissal, and action dispatch |
| lib/intellihide.js | Window overlap and visibility recalculation |
| lib/manager.js | Extension lifecycle and monitor changes |
| lib/magnifier.js | Hover animation and icon layout interactions |
| lib/indicators.js | Running, focused, urgent, and minimized indicators |
| lib/theme.js | Theme loading, file changes, and fallback behavior |
| lib/utils.js | Shared helpers used by runtime modules |
| lib/constants.js | Shared runtime constants |

These files depend on GNOME Shell/GObject/Clutter/St APIs or are only reached through those runtime modules. The next meaningful step is to extract more behavior behind testable seams or add a supported nested-Shell integration harness. Do not add mocks that merely assert implementation details or claim runtime coverage without exercising the behavior.

## Keeping the baseline useful

- npm test runs Node's test runner with --experimental-test-coverage; the summary is visible in CI logs.
- When tests are added, record the new measured report and update this baseline.
- Prefer tests for regression-prone lifecycle and error paths over chasing a headline percentage.
- Keep live GNOME Shell smoke tests separate; see the [testing workflow](../TESTING.md), [Wayland validation matrix](wayland-validation-matrix.md), and [GNOME session checklist](gnome-smoke-test.md).
