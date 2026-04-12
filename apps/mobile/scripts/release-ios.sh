#!/usr/bin/env bash
set -euo pipefail

# ── Navigate to repo root ────────────────────────────────────────
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# ── 1. Version bump ──────────────────────────────────────────────
BUMP_TYPE="${1:-patch}"   # patch | minor | major | X.Y.Z
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
git commit -m "chore: release v${NEW_VERSION}

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git tag "v${NEW_VERSION}"
git push && git push --tags
echo "Tagged and pushed v${NEW_VERSION}"

# ── 4. Build iOS ─────────────────────────────────────────────────
cd apps/mobile

LOGFILE="build-$(date +%s).log"

# Check if we're on a Mac
if [[ "$(uname)" == "Darwin" ]]; then
  echo ""
  echo "macOS detected - building locally"
  BUILD_LOCAL=true
else
  echo ""
  echo "Not macOS - building in the cloud"
  BUILD_LOCAL=false
fi

if [[ "$BUILD_LOCAL" == true ]]; then
  echo "Starting local iOS build..."
  echo "Logs: $LOGFILE"
  echo ""

  set +e
  script -q "$LOGFILE" eas build --platform ios --profile production --local
  EXIT_CODE=$?
  set -e

  if [[ $EXIT_CODE -ne 0 ]]; then
    echo ""
    echo "Build failed (exit code $EXIT_CODE). Check $LOGFILE for details."
    exit $EXIT_CODE
  fi

  echo ""
  echo "Build successful!"

  # Parse the log to find the .ipa path
  IPA_PATH=$(grep -oE '/[^ ]+\.ipa' "$LOGFILE" | tail -1)

  if [[ -z "$IPA_PATH" ]]; then
    echo "Could not find .ipa path in build output. Check $LOGFILE manually."
    exit 1
  fi

  echo "Build artifact: $IPA_PATH"
  echo ""

  # Confirm before submitting
  read -rp "Submit this build to App Store Connect? [y/N] " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Submission cancelled."
    exit 0
  fi

  echo "Submitting to App Store Connect..."
  eas submit --platform ios --path "$IPA_PATH" --profile production
  echo "Done!"

else
  echo "Starting cloud iOS build..."
  echo "Logs: $LOGFILE"
  echo ""

  set +e
  script -q "$LOGFILE" eas build --platform ios --profile production
  EXIT_CODE=$?
  set -e

  if [[ $EXIT_CODE -ne 0 ]]; then
    echo ""
    echo "Build failed (exit code $EXIT_CODE). Check $LOGFILE for details."
    exit $EXIT_CODE
  fi

  echo ""
  echo "Cloud build complete!"
  echo ""
  echo "To submit, run:"
  echo ""
  echo "  eas submit --platform ios --profile production --latest"
  echo ""
fi
