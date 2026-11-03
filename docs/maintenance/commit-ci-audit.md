# Commit CI Audit Ledger

Persistent repository-specific record of commit-level CI checks and red-cross investigations.

## How to use this ledger

1. Read this file before auditing commit checks.
2. Check only commits newer than the checkpoint, plus older **red**, **pending**, or explicitly unresolved entries.
3. Record exact commit SHAs and observed results; never infer from missing badges or empty API responses.
4. Preserve failures and append diagnosis, fix, rerun, and final-outcome evidence.
5. Advance the checkpoint only after reviewing the range; carry unresolved entries forward.

## Result meanings

| Result | Meaning |
|---|---|
| **green** | Completed successful check/run directly observed. |
| **red** | Completed failing check/run directly observed. |
| **pending** | Check/run exists but is unfinished. |
| **unavailable** | Available evidence did not expose a result; not a pass or failure. |
| **not applicable** | Workflow configuration confirms no relevant check is triggered. |

## Checkpoint

- Repository: `SakibShahariar/material-dock`
- Default branch: `main`
- Checkpoint SHA: `20def028600d72a3b68aed531274102647f94de8`
- Initialized: 2026-11-02
- Baseline: latest branch tip queried through combined commit-status endpoint; empty status list recorded as **unavailable**, not green/red. Older history was not retroactively audited during setup.
- Next session: review commits after this checkpoint, including the next audit-ledger checkpoint commit; retain and revisit the red-cross history only if new evidence or regressions appear.

## Initial baseline

| Commit SHA | Subject | CI result | Checked | Follow-up |
|---|---|---|---|---|
| `00286c45e353341619c21c9cec66c207c6db333c` | Default-branch tip at ledger initialization | unavailable | 2026-11-02 | Combined status lookup returned no entries. Revisit if new run or visible failure evidence appears. |

## Red-cross investigation log

No red result was confirmed from the status data retrieved during setup.

### Failure record template

- Commit SHA:
- Commit subject:
- First observed (date):
- Workflow / run URL:
- Failed job / step:
- Failure summary:
- Classification: regression / pre-existing / inconclusive
- Fix commit(s):
- Rerun attempt(s) and result:
- Final verified outcome:
- Remaining follow-up:

## Session history

| Date | Reviewed range / checkpoint | Result summary |
|---|---|---|
| 2026-11-02 | Initial checkpoint: `00286c45e353341619c21c9cec66c207c6db333c` | Latest commit queried; empty status response recorded as unavailable. Earlier history not retroactively audited. |


## 2026-11-03 issue triage and maintenance setup audit

The combined commit-status endpoint returned empty lists, but the repository Actions API exposed push-triggered CI and Validate runs. The earlier PR-only workflow-run lookup was not a complete source of push results. All four commits in this setup batch have completed **green** CI and Validate runs; exact run links are recorded below.

| Commit SHA | Subject | CI | Validate | Overall |
|---|---|---|---|---|
| `8a0f8956e4bd59adc84ab475a1e3b7ed56988a81` | docs: define issue triage categories | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41325608446) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41325608445) | green |
| `c349247f71b3736586af63cf58053d44fce0a897` | docs: document incremental commit CI auditing | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41456702127) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41456702126) | green |
| `543cbc63b5cf15245c980635f9194fa739fcf56c` | docs: add persistent commit CI audit ledger | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41456696095) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41456696183) | green |
| `9514093857758799749edffc44b51a264f070632` | docs(maintenance): classify all open issues | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41583628700) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41583628745) | green |

| 2026-11-03 | `00286c45e353341619c21c9cec66c207c6db333c` → `9514093857758799749edffc44b51a264f070632` | All four documentation/triage commits passed both push-triggered workflows. The issue tracker classifies all 31 open issues; source reviews were added to #30, #59, and #72. |

## Requested latest-30 commit Actions audit (2026-11-03)

Reviewed the 30 commits immediately preceding the current audit-ledger commit, from `0c93d93614b7fc3e54f6f203975f47b73a36261d` through `e07d5e9c0cf2da3e5b5fbd5b158514eb1035d6ba`. The combined commit-status endpoint was empty for these commits, but direct inspection of push-triggered GitHub Actions runs recovered the actual CI and Validate outcomes. **16 of the 30 commits had at least one failed workflow (21 failed workflow runs total: 16 Validate failures and 5 CI failures).** The failures were diagnosed and later corrected by follow-up commits; the green fix commits are listed in the failure log below. This history is preserved rather than relabeled as green.

| Commit SHA | Subject | CI | Validate | Overall |
|---|---|---|---|---|
| `0c93d93614b7fc3e54f6f203975f47b73a36261d` | docs(maintenance): record triage CI audit | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41583679157) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41583679124) | green |
| `9514093857758799749edffc44b51a264f070632` | docs(maintenance): classify all open issues | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41583628700) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41583628745) | green |
| `8a0f8956e4bd59adc84ab475a1e3b7ed56988a81` | docs: define issue triage categories | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41573462597) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41573462802) | green |
| `c349247f71b3736586af63cf58053d44fce0a897` | docs: document incremental commit CI auditing | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41456702127) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41456702126) | green |
| `543cbc63b5cf15245c980635f9194fa739fcf56c` | docs: add persistent commit CI audit ledger | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41456696095) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41456696183) | green |
| `00286c45e353341619c21c9cec66c207c6db333c` | docs: improve maintenance workflow guidance | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41400693794) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41400693836) | green |
| `6f3f37b6db0377281b8e73ca568b12487c3516d8` | docs(agents): require verified issue checklists | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41325608446) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41325608445) | green |
| `eb5a7b91008e4e91432a0576b25c4888c8b7a35b` | docs(agents): require clean checks before commits | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41302882614) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41302882612) | green |
| `3f8b056859166816cf817d58ef47c9850437650d` | style(layout): apply separator formatter output (#81) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41301233567) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41301233477) | green |
| `7d0706e05befa06157eee353bd4ab1a2c4e177d4` | ci: inspect separator formatter output (#81) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41301141549) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41301141517) | red |
| `cc298c456ecf49b786ec74d2e51f33d09ddb812b` | feat(layout): add optional section separators (#81) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41300999932) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41300999973) | red |
| `fae268396c0ad379be2eae1b8e41e68a0400fce6` | style(stacks): apply formatter output to folder counts (#67) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41300851726) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41300851715) | green |
| `4e98d0100397504e2926a8064154d10716a9a92c` | ci: inspect folder count formatting output (#67) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41300779360) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41300779578) | red |
| `02b258fcb6da0daee1468413992c532bd3c7e983` | style(stacks): wrap folder count guards (#67) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41300696849) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41300696926) | red |
| `f1610112f349c1fee9108916bc986eb96ffb4a79` | style(stacks): normalize folder count control flow (#67) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41300523525) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41300523588) | red |
| `4b9667fd5757560419369c97dcab8eeef413ef65` | style(stacks): format folder count monitor callback (#67) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41300375483) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41300375485) | red |
| `1cf67dc5b891d30c7321d4135475b854d540b7cb` | docs: add AI agent instructions | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41300222980) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41300222946) | red |
| `bae770025882a1be46c2fef81461d0145a821338` | feat(stacks): show live folder item counts (#67) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41300216234) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41300216278) | red |
| `d49ebe86d3f0745b23539005931b331148734726` | fix(layout): restore valid multiline formatting (#61) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41298674404) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41298674403) | green |
| `4182fe49c937f36579d4fbbd957cb242b7fc6434` | fix(layout): restore valid multiline formatting (#61) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298669497) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298669559) | red |
| `0540ef5c71f747a3872cae2a7d9b2ab3740b0516` | style(layout): format magnification reserve changes (#61) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298647008) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298647024) | red |
| `3c3f377fc618ff541bb4c0d55689cb9ad4360e66` | fix(layout): apply magnification edge reserve (#61) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41298571259) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298571275) | red |
| `f425a66c646224356cf7849391916938be12cdd5` | fix(layout): correct available-width calculation syntax (#61) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41298519114) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298519117) | red |
| `be845ca7955d7f3c1f7dd6c2b56c35ca30bd2010` | fix(layout): correct magnification helper import (#61) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298476604) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298476593) | red |
| `a5e39d305cdff12462974ef83f0047e1edf0cdc0` | fix(test): correct layout test imports (#61) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298440432) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298440474) | red |
| `58f1b7cf5cdc34ae14534666a6957e7106d2be81` | fix(layout): keep magnified icons inside monitor work area (#61) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298396398) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41298396411) | red |
| `119efa3240a0cebd4c00f503c24dba9b965576f5` | ci: restore JavaScript formatting check (#97) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41297433605) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41297433632) | green |
| `2e9115a8e47937672eeb5d8ad1d460d315d35d50` | style(stacks): match formatter chain layout (#97) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41297429832) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41297429905) | green |
| `8eeee572faeed4ed3debeab8d14781ab3886893f` | ci: inspect group action formatter output (#97) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41297390210) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41297390156) | green |
| `e07d5e9c0cf2da3e5b5fbd5b158514eb1035d6ba` | style(stacks): format group window filtering (#97) | [success](https://github.com/SakibShahariar/material-dock/actions/runs/41297349140) | [failure](https://github.com/SakibShahariar/material-dock/actions/runs/41297349151) | red |

## Red-cross investigation and fix mapping

| Failed commit | Failed run ID(s) | Observed failure | Follow-up fix | Final evidence |
|---|---|---|---|---|
| `7d0706e05befa06157eee353bd4ab1a2c4e177d4` | 41301141517 | Prettier rejected `lib/section-separators.js` and `tests/section-separators.test.js`. | `3f8b056859166816cf817d58ef47c9850437650d` | Formatting output applied; both CI and Validate passed on the fix commit. |
| `cc298c456ecf49b786ec74d2e51f33d09ddb812b` | 41300999973 | Same section-separator Prettier mismatch. | `3f8b056859166816cf817d58ef47c9850437650d` | Formatting output applied; both CI and Validate passed on the fix commit. |
| `4e98d0100397504e2926a8064154d10716a9a92c` | 41300779578 | Prettier rejected `lib/stacks.js` folder-count callback/guard formatting. | `fae268396c0ad379be2eae1b8e41e68a0400fce6` | Formatter output applied; both CI and Validate passed on the fix commit. |
| `02b258fcb6da0daee1468413992c532bd3c7e983` | 41300696926 | Prettier rejected `lib/stacks.js` guard formatting. | `fae268396c0ad379be2eae1b8e41e68a0400fce6` | Formatter output applied; both CI and Validate passed on the fix commit. |
| `f1610112f349c1fee9108916bc986eb96ffb4a79` | 41300523588 | Prettier rejected `lib/stacks.js` control-flow formatting. | `fae268396c0ad379be2eae1b8e41e68a0400fce6` | Formatter output applied; both CI and Validate passed on the fix commit. |
| `4b9667fd5757560419369c97dcab8eeef413ef65` | 41300375485 | Prettier rejected `lib/stacks.js` monitor-callback formatting. | `fae268396c0ad379be2eae1b8e41e68a0400fce6` | Formatter output applied; both CI and Validate passed on the fix commit. |
| `1cf67dc5b891d30c7321d4135475b854d540b7cb` | 41300222946 | Prettier still rejected `lib/stacks.js`; adding `AGENTS.md` did not cause the failure. | `fae268396c0ad379be2eae1b8e41e68a0400fce6` | Formatter output applied; both CI and Validate passed on the fix commit. |
| `bae770025882a1be46c2fef81461d0145a821338` | 41300216278 | Prettier rejected newly added folder-count code in `lib/stacks.js`. | `fae268396c0ad379be2eae1b8e41e68a0400fce6` | Formatter output applied; both CI and Validate passed on the fix commit. |
| `4182fe49c937f36579d4fbbd957cb242b7fc6434` | 41298669559; 41298669497 | ESLint parsing and Node tests failed on malformed literal `\\n` sequences in JavaScript import/call formatting. | `d49ebe86d3f0745b23539005931b331148734726` | `4182` corrected `lib/dock.js`; `d49` corrected `tests/layout.test.js`. Both CI and Validate passed on `d49`. |
| `0540ef5c71f747a3872cae2a7d9b2ab3740b0516` | 41298647024; 41298647008 | Formatting edit reintroduced literal `\\n` sequences; ESLint and Node tests failed with parse/SyntaxError. | `d49ebe86d3f0745b23539005931b331148734726` | The valid multiline imports/call were restored; both workflows passed on `d49`. |
| `3c3f377fc618ff541bb4c0d55689cb9ad4360e66` | 41298571275 | Prettier rejected `lib/dock.js` and `tests/layout.test.js` formatting. | `4182fe49c937f36579d4fbbd957cb242b7fc6434; d49ebe86d3f0745b23539005931b331148734726` | Final source/test formatting was restored across the two follow-up commits; both workflows passed on `d49`. |
| `f425a66c646224356cf7849391916938be12cdd5` | 41298519117 | ESLint reported `magnificationReserve` assigned but unused in `lib/dock.js`. | `3c3f377fc618ff541bb4c0d55689cb9ad4360e66` | The value was applied to start/end dock positioning; the subsequent Validate failure was a separate formatting issue, later corrected by `4182`/`d49`. |
| `be845ca7955d7f3c1f7dd6c2b56c35ca30bd2010` | 41298476593; 41298476604 | Malformed literal `\\n` in the `lib/dock.js` import caused ESLint parse failure; the Node syntax/test job also failed. | `4182fe49c937f36579d4fbbd957cb242b7fc6434; d49ebe86d3f0745b23539005931b331148734726` | Dock import and test import were restored to real multiline syntax; both workflows passed on `d49`. |
| `a5e39d305cdff12462974ef83f0047e1edf0cdc0` | 41298440474; 41298440432 | ESLint/Node tests still failed while the dock source contained malformed escaped newline syntax. | `4182fe49c937f36579d4fbbd957cb242b7fc6434; d49ebe86d3f0745b23539005931b331148734726` | Dock and test syntax corrections completed; both workflows passed on `d49`. |
| `58f1b7cf5cdc34ae14534666a6957e7106d2be81` | 41298396411; 41298396398 | The first magnification-reserve edit inserted literal `\\n` text into import/call syntax; ESLint and Node tests failed. | `4182fe49c937f36579d4fbbd957cb242b7fc6434; d49ebe86d3f0745b23539005931b331148734726` | The malformed sequences were replaced with real newlines; both workflows passed on `d49`. |
| `e07d5e9c0cf2da3e5b5fbd5b158514eb1035d6ba` | 41297349151 | Prettier rejected the group-window `.get_windows().filter()` chain in `lib/stacks.js`. | `2e9115a8e47937672eeb5d8ad1d460d315d35d50` | Chain layout was changed to match Prettier; both CI and Validate passed on the fix commit. |

### Verified follow-up commits

- [3f8b056](https://github.com/SakibShahariar/material-dock/commit/3f8b056859166816cf817d58ef47c9850437650d): CI and Validate passed after the section-separator formatting corrections.
- [fae2683](https://github.com/SakibShahariar/material-dock/commit/fae268396c0ad379be2eae1b8e41e68a0400fce6): CI and Validate passed after folder-count formatting corrections.
- [d49ebe8](https://github.com/SakibShahariar/material-dock/commit/d49ebe86d3f0745b23539005931b331148734726): CI and Validate passed after the layout source and test syntax were restored.
- [2e9115a](https://github.com/SakibShahariar/material-dock/commit/2e9115a8e47937672eeb5d8ad1d460d315d35d50): CI and Validate passed after the group-window formatter correction.

## 2026-11-03 audit-ledger commit check

- Commit: `9b01f66fbaaffa6357da4ffb2c653df5c766c0c3` — `docs(maintenance): audit latest 30 commit statuses`
- CI: [success](https://github.com/SakibShahariar/material-dock/actions/runs/41583823339)
- Validate: [success](https://github.com/SakibShahariar/material-dock/actions/runs/41583823461)
- Result: **green**, both push-triggered workflows completed successfully.

- Commit: `cfb52b17398add8034809057c99e66cc76f78201` — `docs(maintenance): record actual CI failures and fixes`
- CI: [success](https://github.com/SakibShahariar/material-dock/actions/runs/41584180439)
- Validate: [success](https://github.com/SakibShahariar/material-dock/actions/runs/41584180418)
- Result: **green**, both push-triggered workflows completed successfully.

- Commit: `a15053831d0d030399f68a78c6bc3064daa1e9a6` — `docs(maintenance): checkpoint verified Actions audit`
- CI: [success](https://github.com/SakibShahariar/material-dock/actions/runs/41584251518)
- Validate: [success](https://github.com/SakibShahariar/material-dock/actions/runs/41584251490)
- Result: **green**, both push-triggered workflows completed successfully.

- Commit: `20def028600d72a3b68aed531274102647f94de8` — `docs(maintenance): correct audit checkpoint`
- CI: [success](https://github.com/SakibShahariar/material-dock/actions/runs/41584338863)
- Validate: [success](https://github.com/SakibShahariar/material-dock/actions/runs/41584339032)
- Result: **green**, both push-triggered workflows completed successfully.
