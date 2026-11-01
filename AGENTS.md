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
