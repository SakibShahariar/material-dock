# Instructions for AI Coding Agents

These instructions apply to the entire repository. Follow any more specific `AGENTS.md` found in a subdirectory as well. If instructions conflict, prefer the most specific applicable project guidance, while preserving the safety rules below.

## Before Making Changes

- Read the project README, contribution guidance, relevant source files, tests, build configuration, and recent history before editing.
- Identify the default branch and work on it directly. Do not create branches or pull requests unless explicitly requested.
- Check the current working tree and latest remote state before writing. Never overwrite unrelated or newer work.
- Understand the reported problem and reproduce it where practical. Prefer fixing root causes over symptoms.
- Preserve existing architecture, public interfaces, user data, compatibility, and project conventions unless a change is necessary and justified.
- Do not assume a language, framework, package manager, build system, or test command. Discover and use what this repository actually provides.

## Issue Triage and Implementation

- Prioritize existing, actionable open issues over speculative features or cosmetic churn.
- Prefer small, independently verifiable issues that can be completed confidently. Work on multiple independent issues during a maintenance session when practical, without mixing unrelated changes into one commit.
- Do not close an issue merely because code was changed. Close it only after the stated acceptance criteria are met and the fix has been verified to the extent possible.
- Reference the relevant issue number in the commit message when a commit fixes an issue (for example, `Fixes #123` in the commit body when appropriate).
- Keep issues open when validation requires unavailable hardware, a user-specific environment, an interactive desktop session, credentials, or manual confirmation. Explain what remains to be checked instead of claiming completion.
- Do not close user-created issues or mark work as not planned unless the repository owner explicitly directs you to do so.

## Acceptance Criteria and Issue Checklists

- Write explicit, testable acceptance criteria for each issue before implementation. Use GitHub task-list checkboxes (`- [ ]`) so progress is visible and auditable.
- Treat every checkbox as a claim that must be supported by evidence. Check a box only after the corresponding behavior or deliverable has been implemented and verified; code changes, a commit, or a passing unrelated test are not sufficient evidence.
- Keep criteria specific and independently verifiable. Separate automated checks from manual, runtime, hardware, accessibility, and environment-dependent validation where relevant.
- Before closing an issue, re-read its current description and verify every acceptance criterion. Do not close it while any in-scope criterion remains incomplete or unverified.
- If work is incomplete, leave the issue open and keep the relevant boxes unchecked. State precisely what remains and what evidence or environment is needed.
- When auditing previously closed issues, compare each original acceptance criterion with the implementation and available test evidence. Update checkboxes honestly; never tick boxes retroactively based only on the fact that the issue was closed.
- Reopen a closed issue when an in-scope requirement remains incomplete or requires validation that has not occurred. Preserve the original context and explain the remaining work in the issue.
- For duplicate issues, link to the canonical issue and keep the duplicate's acceptance boxes unchecked unless the duplicate was independently completed and verified. Track completion on the canonical issue to avoid misleading duplicate checklists.
- After editing an issue description or state, fetch it again and confirm that the intended checklist and status were saved.


## Code Quality and Testing

- Follow the repository's established formatting, naming, documentation, dependency, and error-handling conventions.
- Add or update focused tests for behavior changes when the project has a suitable test setup.
- Run relevant available tests, linters, formatters, type checks, and build checks. Do not add CI workflows or checks without a concrete project need.
- Inspect the complete output and exit status of every check. Fix failures caused by your changes; investigate pre-existing failures and report them accurately.
- **Pre-commit quality gate:** before creating any commit, run the checks applicable to the changed files and the full repository checks below. Do not commit an intermediate state that is already known to fail formatting, lint, syntax, or tests.
- For this repository, run:
  ```sh
  npm test
  npm run lint
  npm run format:check
  while IFS= read -r -d '' file; do node --check "$file"; done < <(find . -path './.git' -prune -o -name '*.js' -type f -print0)
  glib-compile-schemas --strict --dry-run schemas/
  bash -n install.sh
  shellcheck install.sh
  ```
  Run each command that is available in the environment. If a tool is missing, do not silently skip the check: state that it could not be run. The GitHub Validate workflow is authoritative for its configured checks; inspect its actual result after pushing.
- If any check fails, stop before committing, identify the failing file/step, fix the cause, and rerun the failed check plus the relevant regression tests. Do not use a follow-up formatting-only or diagnostic commit as a substitute for validating the original change.
- Do not modify, weaken, bypass, or temporarily instrument CI workflows merely to get a change accepted or to expose formatter output. If a workflow itself is genuinely defective, make a separately justified fix and verify it.
- Static checks do not prove runtime, graphical, hardware, or platform integration behavior. In particular, do not claim GNOME Shell/session compatibility without testing in a real GNOME session.
- If a necessary test cannot be run in the available environment, state the limitation clearly and leave validation-dependent work unresolved.
- Review all commits created during the maintenance run and their associated CI/check results, not only the latest commit. Do not report a check as passing unless its result was actually observed.

## Git and Commit Practices

- Commit directly to the repository's existing default branch; do not force-push, rewrite history, reset away others' work, or amend published commits.
- Fetch/review the latest branch state before committing. Keep changes focused and avoid including unrelated modifications.
- Use the repository's documented commit convention. If none exists, use clear Conventional Commit messages such as `fix(scope): ...`, `feat(scope): ...`, `docs: ...`, or `test: ...`.
- Include issue references for issue-related commits. Do not create empty or misleading commits.
- Prefer one complete, focused commit per independently finished issue. Do not create a series of commits for successive formatting corrections; finish the implementation and formatting before committing.
- After committing, verify the commit exists on the intended default branch and inspect the resulting diff/status.

## Documentation and Dependencies

- Keep documentation accurate, concise, and consistent with the actual implementation.
- Do not duplicate information already maintained elsewhere or add lengthy documentation without a clear benefit.
- Avoid new dependencies when the existing stack can solve the problem. Justify any dependency or build-system change.
- Never invent supported platforms, installation commands, test results, performance claims, or feature status.

## Reporting

- Summarize concrete changes with file paths and commit identifiers.
- Distinguish verified results from assumptions and unrun checks.
- List remaining manual validation, blockers, and issues intentionally left open.

## Maintenance Session Execution

- Start by reviewing actionable open issues in batches. Identify dependencies, shared root causes, acceptance criteria, and tasks that do not require unavailable runtime access.
- Do not limit a maintenance session to one issue when several independent, source-verifiable issues are ready. Implement multiple useful fixes in the same session and continue until actionable work is exhausted or a genuine blocker remains.
- Group related fixes into coherent commits when they share a root cause or change set. Keep unrelated work in separate focused commits; do not create a commit for every trivial edit or combine unrelated issues merely to increase issue count. Preserve any stricter repository-specific commit requirements above.
- Do not pause for approval or send a progress report after every issue or commit. Continue through the planned batch, verify the work, and report at a meaningful stopping point.
- If an issue requires unavailable hardware, credentials, a live desktop session, or user confirmation, leave it open and continue with independently verifiable work.
- Treat each commit as unfinished until its associated CI and checks reach a final state. Inspect failed job details, fix regressions introduced by the change, and rerun relevant checks. Pending checks are not passing checks.
- Before ending a session, review all commits made during that session, their CI results, remaining actionable issues, and required manual validation.
- Optimize for verified issue completion and a healthy default branch, not commit volume, issue-closure volume, or frequent status messages.
