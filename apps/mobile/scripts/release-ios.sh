#!/usr/bin/env bash
set -euo pipefail

# cd to apps/mobile regardless of where this is invoked from
cd "$(dirname "$0")/.."

LOGFILE="build-$(date +%s).log"

# 1. Check if we're on a Mac
if [[ "$(uname)" == "Darwin" ]]; then
  echo "macOS detected - building locally"
  BUILD_LOCAL=true
else
  echo "Not macOS - building in the cloud"
  BUILD_LOCAL=false
fi

if [[ "$BUILD_LOCAL" == true ]]; then
  # 2. Build locally — use `script` to log while preserving full TTY interactivity
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

  # 3. Parse the log to find the .ipa path
  IPA_PATH=$(grep -oE '/[^ ]+\.ipa' "$LOGFILE" | tail -1)

  if [[ -z "$IPA_PATH" ]]; then
    echo "Could not find .ipa path in build output. Check $LOGFILE manually."
    exit 1
  fi

  echo "Build artifact: $IPA_PATH"
  echo ""

  # 4. Confirm before submitting
  read -rp "Submit this build to App Store Connect? [y/N] " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Submission cancelled."
    exit 0
  fi

  # 5. Submit — fully interactive
  echo "Submitting to App Store Connect..."
  eas submit --platform ios --path "$IPA_PATH" --profile production
  echo "Done!"

else
  # Cloud build path — fully interactive
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
