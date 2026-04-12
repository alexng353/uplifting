#!/usr/bin/env bash
set -euo pipefail

# Shared iOS build + submit logic.
# Called by release-ios.sh and testflight.sh — not meant to be
# invoked directly.

cd "$(git rev-parse --show-toplevel)/apps/mobile"

LOGFILE="build-$(date +%s).log"

if [[ "$(uname)" == "Darwin" ]]; then
  echo ""
  echo "macOS detected — building locally"
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

  IPA_PATH=$(grep -oE '/[^ ]+\.ipa' "$LOGFILE" | tail -1)

  if [[ -z "$IPA_PATH" ]]; then
    echo "Could not find .ipa path in build output. Check $LOGFILE manually."
    exit 1
  fi

  echo "Build artifact: $IPA_PATH"
  echo ""

  read -rp "Submit this build to App Store Connect? [y/N] " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Submission cancelled."
    exit 0
  fi

  echo "Submitting to App Store Connect..."
  eas submit --platform ios --path "$IPA_PATH" --profile production
  echo "Done!"

else
  echo ""
  echo "Not macOS — building in the cloud"
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
