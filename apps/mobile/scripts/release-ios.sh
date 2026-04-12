#!/usr/bin/env bash
set -euo pipefail

# ── Usage ─────────────────────────────────────────────────────────
# bun release:ios --patch        (default)
# bun release:ios --minor
# bun release:ios --major
# bun release:ios --version 2.0.0

usage() {
  echo "Usage: release-ios.sh [--patch|--minor|--major|--version X.Y.Z]"
  exit 1
}

# ── Parse flags ───────────────────────────────────────────────────
BUMP_TYPE="patch"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --patch)  BUMP_TYPE="patch";  shift ;;
    --minor)  BUMP_TYPE="minor";  shift ;;
    --major)  BUMP_TYPE="major";  shift ;;
    --version)
      BUMP_TYPE="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown flag: $1"; usage ;;
  esac
done

# ── Navigate to repo root ────────────────────────────────────────
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# ── 1. Version bump ──────────────────────────────────────────────
echo "Bumping version ($BUMP_TYPE)..."
NEW_VERSION=$(bun scripts/bump-version.ts "$BUMP_TYPE")
echo "New version: $NEW_VERSION"

# ── 2. Generate changelog ────────────────────────────────────────
echo ""
echo "Generating changelog..."
bun scripts/generate-changelog.ts \
  --version "$NEW_VERSION" \
  --date "$(date +%Y-%m-%d)"
echo ""

# ── 3. Commit, tag, and push the release ─────────────────────────
git add CHANGELOG.md apps/mobile/app.json apps/mobile/package.json
git commit -m "chore: release v${NEW_VERSION}"
git tag "v${NEW_VERSION}"
git push && git push --tags
echo "Tagged and pushed v${NEW_VERSION}"

# ── 4. Build + submit ────────────────────────────────────────────
bash apps/mobile/scripts/build-ios.sh

# ── 5. Commit any build-time changes (e.g. app.json) ─────────────
cd "$ROOT"
if [[ -n "$(git status --porcelain)" ]]; then
  echo ""
  echo "Committing build-time changes..."
  git add -A
  git commit -m "chore: post-build artifacts (v${NEW_VERSION})"
  git push
fi
