# Release checklist

Use this checklist before publishing a tagged release. A green CI run verifies static checks and unit tests; it does not replace a GNOME Shell session smoke test.

## Before tagging

- [ ] Review the changes since the previous release and update `CHANGELOG.md`.
- [ ] Verify `metadata.json` and the supported GNOME Shell versions are accurate.
- [ ] Run the GitHub Actions `CI` and `Validate` workflows on the intended commit.
- [ ] Complete the applicable checks in [the GNOME Shell smoke-test checklist](gnome-smoke-test.md) on every version being declared supported, or clearly document unverified versions.
- [ ] Check that no credentials, local paths, debug dumps, or unrelated files are included in the extension package.
- [ ] Confirm the installer and packaged extension both include the required runtime files and schema.

## Publishing

- [ ] Create and push an annotated version tag such as `v1.0.0` on the reviewed commit.
- [ ] Confirm the tagged-release workflow completes and publishes the extension ZIP and SHA-256 checksum.
- [ ] Download the published ZIP and checksum; verify the checksum with `sha256sum -c`.
- [ ] Inspect the archive contents and install it in a test profile before announcing the release.
- [ ] Link the release notes and document any known limitations.

## After publishing

- [ ] Verify the release page and both downloadable assets are accessible.
- [ ] Keep the release's source tag immutable; fix problems in a follow-up commit and publish a new tag.
