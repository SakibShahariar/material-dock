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


## Incremental audit: 2026-11-03 checkpoint through 2026-11-13

Reviewed the 38 commits after the prior checkpoint `20def028600d72a3b68aed531274102647f94de8` through the current `main` head. Statuses below are from observed push-triggered Actions runs. **unavailable** means no matching run was exposed in the retrieved first 100 Actions records; it is not a pass. The recent red Validate results were formatting failures, not GNOME runtime checks. The 2026-11-13 visual change also exposed a stale Matugen opacity assertion; the corrected test and source-hygiene formatting are green on the final checkpoint commit.

| Commit SHA | Subject | Result | Actions evidence |
|---|---|---|---|
| `fe1959b99342301eea4abc48f7b056bf28e41cd1` | fix(test): correct source hygiene newline matcher | **green** | CI 43398814880; Validate 43398814937 |
| `6ad5a7813e61f5ac508cca16457ac2926c109285` | fix(test): correct source hygiene newline matcher | **red** | CI 43398781540; Validate 43398782104 |
| `5cf631efbf97434f78827578d149fa9225fbf639` | style(test): simplify source hygiene regression check | **red** | CI 43398735663; Validate 43398735514 |
| `6cf43f68335156ffb5a4936862e44a9f841a0495` | test(theme): update Matugen surface opacity expectation | **red** | CI 43398640894 success; Validate 43398640890 failure |
| `4562aaf801a9f9ee7cf5749eaa7a1f861d44c781` | fix(validation): restore formatting and dock style assertions | **red** | CI 43398514988; Validate 43398514862 |
| `750f686ff1b0be17fa69b211071bb987234e61e7` | style(dock): refine floating dock surface and indicators | **red** | CI 43398352621; Validate 43398352506 |
| `5b76b5410328c38beb8b9d15bad8dfcb323beaa5` | fix: avoid app name lookup during window teardown | **red** | CI 43160848111 success; Validate 43160848104 failure |
| `5924e70e383915e95b0989a3220c87120ae4b08f` | fix: avoid shell abort for closed window-backed apps | **red** | CI 43160443437 success; Validate 43160443586 failure |
| `d07630cbe3babb533d74cec311006e7ad23bf9c9` | fix(dock): normalize icon spacing and separators | **red** | CI 43028689500 success; Validate 43028689544 failure |
| `b526a32a26c8fac73cb5f0d20e6f7317ea7aadbd` | chore(metadata): declare Shell 51 support | **red** | CI 43026698268 success; Validate 43026698207 failure |
| `565f0b4e6e371850eec5b63b19317faf2d189c63` | fix(extension): load the stylesheet through St.Theme on Shell 51 | **unavailable** | No workflow run observed in the retrieved Actions page |
| `8cf4f425b0e0ae81f6a462a37ff6080595012ff7` | feat(prefs): add icons to the preference page tabs | **unavailable** | No workflow run observed in the retrieved Actions page |
| `b65ac74daadf6846c38f906179a667223c09cd62` | fix(runtime): repair Shell 51 hover magnifier and accessible description | **unavailable** | No workflow run observed in the retrieved Actions page |
| `ab3b6c6d6af139f2f8d5bed372d8e531134142b5` | fix(theme): remove stray closing brace from generated Matugen CSS | **unavailable** | No workflow run observed in the retrieved Actions page |
| `6b62d94296509ea191f75cdb23912fb0c3185183` | fix(stylesheet): use St-parseable colors and ship light/dark variants | **unavailable** | No workflow run observed in the retrieved Actions page |
| `78608c07125a8373a822e604357878ebbdeb8cd4` | fix(layout): align reserve expression with project formatting (#72) | **green** | CI 43012115906; Validate 43012115912 |
| `6d92bb15e9c3f9d5c05275dd3197dbe7fada27f4` | style(layout): format adaptive reserve expression (#72) | **red** | CI 43012028307 success; Validate 43012028265 failure |
| `ee0b5978b01d70713d8bce3a440b0931fd823230` | fix(layout): clarify alignment reserve calculation (#72) | **red** | CI 43011921003 success; Validate 43011921045 failure |
| `36de5317a4a386fe6306d986dbcbef5379d15036` | fix(layout): account for aligned magnification bounds (#72) | **red** | CI 43011688029 success; Validate 43011688049 failure |
| `309fad13c73e1c1df1015612aa93a970df456050` | chore(format): exclude generated Matugen stylesheet template | **green** | CI 42980509571; Validate 42980509562 |
| `6c3b47314ba02faef16ac0337b8de287fbd8421e` | style(theme): space Matugen palette initialization | **red** | CI 42980416367 success; Validate 42980416260 failure |
| `8099c060ed948d73ce20ceb4f4dd0f1e192a48dc` | refactor(theme): format Matugen stylesheet generation | **red** | CI 42980311235 success; Validate 42980311416 failure |
| `e5178bfa956141b33f254d36a9bfd8b54cbaebcf` | style(theme): separate Matugen parser declarations | **red** | CI 42980172224 success; Validate 42980172275 failure |
| `1cdc00d4c45e69024af9d5aecf112bdab6d85589` | style(theme): preserve generated palette rules formatting | **red** | CI 42980093806 success; Validate 42980093781 failure |
| `8507c03f078e2f939baa25d26a320957d7751e1c` | style(theme): normalize Matugen helper formatting | **red** | CI 42979977209 success; Validate 42979977407 failure |
| `6364a67984ec915799add851406e872be348643e` | style(theme): format Matugen palette implementation | **red** | CI 42979860367 success; Validate 42979860300 failure |
| `18910cebfe73d37539976291c77ec6debad8c1e6` | test(theme): cover complete Matugen dock palette | **red** | CI 42979658363 success; Validate 42979658452 failure |
| `bcb921c5334fdf2b83685164f22a4299915742ce` | fix(theme): apply Matugen Material 3 roles across dock UI | **red** | CI 42979607918 success; Validate 42979607823 failure |
| `db73476c35cb3de38b74c49e7b953be76ada755b` | style: format responsive layout helpers and tests | **green** | CI 42978413882; Validate 42978413783 |
| `21d76eacd5fe52d92d1e5649164f226cf06c3702` | fix(dock): restore repository tree with responsive dock updates | **red** | CI 42978311885 success; Validate 42978311970 failure |
| `2c73659c8bfab6294139762ca23809e336ecb554` | fix(dock): improve responsive sizing and visual balance | **unavailable** | No workflow run observed in the retrieved Actions page |
| `8bf5c8fdd471616c32d72256e237fd490c1a0cca` | fix(stylesheet): remove parser-triggering comment | **green** | CI 42759819320; Validate 42759818870 |
| `058d955a7ab07458db8fd450c8543fe4a8682a8b` | fix(autohide): replace removed pointer watcher API | **green** | CI 42692321142; Validate 42692321527 |
| `61421f892f4f742b4b0d06adedbf0609902fdf0d` | docs: modernize Material Dock README | **green** | CI 42512484339; Validate 42512484341 |
| `d1649f5ee770ab0ada8f9e0befc5f382dbfb6454` | docs(agents): clarify acceptance criteria evidence | **green** | CI 41864245969; Validate 41864245970 |
| `10dd3f44eea65415869365a501bfe4422da14d8a` | docs(agents): define administrative commit hygiene | **green** | CI 41597760804; Validate 41597760789 |
| `6224edce3550a5123829f65cdc3bd7398fbceb8b` | docs(maintenance): split implementation-ready issue triage | **green** | CI 41594828500; Validate 41594828501 |
| `4a1be3f1cbc83204bca6ce8464286f42a0be750b` | docs(maintenance): record final checkpoint verification | **green** | CI 41584427537; Validate 41584427607 |

### 2026-11-13 visual polish follow-up

- `750f686ff1b0be17fa69b211071bb987234e61e7`: both workflows failed. CI exposed an incorrect stylesheet-regex assertion; Validate exposed existing Prettier failures in `extension.js` and `tests/source-hygiene.test.js`.
- `4562aaf801a9f9ee7cf5749eaa7a1f861d44c781`: both workflows failed while the source-hygiene formatter issue and test matcher were still unresolved.
- `6cf43f68335156ffb5a4936862e44a9f841a0495`: CI passed; Validate remained red on source-hygiene formatting.
- `5cf631efbf97434f78827578d149fa9225fbf639` and `6ad5a7813e61f5ac508cca16457ac2926c109285`: interim source-hygiene rewrites still failed CI/Validate and are retained as red history.
- `fe1959b99342301eea4abc48f7b056bf28e41cd1`: final correction; CI and Validate both completed successfully. Validate confirms Prettier, ESLint, JavaScript syntax, all unit tests, schema checks, and installer checks passed.

Checkpoint advanced to `fe1959b99342301eea4abc48f7b056bf28e41cd1` after this review. The older red entries above remain recorded rather than being relabeled green.
