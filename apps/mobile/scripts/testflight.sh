#!/usr/bin/env bash
set -euo pipefail

# Push a TestFlight build without bumping the version number.
# EAS auto-increments the build number (appVersionSource: "remote",
# autoIncrement: true in eas.json).
#
# Usage: bun testflight

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# ── 1. Ensure working tree is clean ──────────────────────────────
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Warning: working tree has uncommitted changes."
  read -rp "Continue anyway? [y/N] " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# ── 2. Build + submit ────────────────────────────────────────────
bash apps/mobile/scripts/build-ios.sh

# ── 3. Commit any build-time changes (e.g. app.json) ─────────────
cd "$ROOT"
if [[ -n "$(git status --porcelain)" ]]; then
  echo ""
  echo "Committing build-time changes..."
  git add -A
  git commit -m "chore: testflight build artifacts"
  git push
fi
