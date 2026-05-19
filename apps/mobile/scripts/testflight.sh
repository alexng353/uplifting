#!/usr/bin/env bash
set -euo pipefail

# Push a TestFlight build without bumping the version number.
# EAS auto-increments the build number (appVersionSource: "remote",
# autoIncrement: true in eas.json).
#
# Usage: bun testflight [-y|--yes]

ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
    -y|--yes) ASSUME_YES=1 ;;
  esac
done

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# ── 1. Ensure working tree is clean ──────────────────────────────
if [[ -n "$(git status --porcelain)" ]]; then
  if [[ $ASSUME_YES -eq 1 ]]; then
    echo "Warning: working tree has uncommitted changes. Continuing (--yes)."
  else
    echo "Warning: working tree has uncommitted changes."
    read -rp "Continue anyway? [y/N] " CONFIRM
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
      echo "Aborted."
      exit 1
    fi
  fi
fi

# ── 2. Build + submit ────────────────────────────────────────────
BUILD_ARGS=()
[[ $ASSUME_YES -eq 1 ]] && BUILD_ARGS+=(--yes)
bash apps/mobile/scripts/build-ios.sh "${BUILD_ARGS[@]}"

# ── 3. Commit any build-time changes (e.g. app.json) ─────────────
cd "$ROOT"
if [[ -n "$(git status --porcelain)" ]]; then
  echo ""
  echo "Committing build-time changes..."
  git add -A
  git commit -m "chore: testflight build artifacts"
  git push
fi
