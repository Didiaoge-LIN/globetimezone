#!/bin/bash
# GlobeTimeZone Firefox Extension Build Script
# Usage: bash build-firefox.sh

set -e

EXT_DIR="$(dirname "$0")/extension-firefox"
DIST_DIR="$(dirname "$0")/dist-firefox"
VERSION=$(node -p "require('${EXT_DIR}/manifest.json').version" 2>/dev/null || echo "1.0.0")

echo "Building Firefox Extension v${VERSION}..."
echo "Source: ${EXT_DIR}"
echo "Output: ${DIST_DIR}"

# Build
cd "${EXT_DIR}"
npx web-ext build --overwrite-dest --artifacts-dir="${DIST_DIR}"

# Rename to .xpi for convenience
ZIP_FILE="${DIST_DIR}/globetimezone_-_world_time_converter-${VERSION}.zip"
XPI_FILE="${DIST_DIR}/globetimezone-${VERSION}.xpi"

if [ -f "${ZIP_FILE}" ]; then
  cp "${ZIP_FILE}" "${XPI_FILE}"
  FILE_SIZE=$(du -h "${XPI_FILE}" | cut -f1)
  echo ""
  echo "=== Build Complete ==="
  echo ".xpi:  ${XPI_FILE} (${FILE_SIZE})"
  echo ".zip:  ${ZIP_FILE}"
  echo ""
  echo "To test locally:"
  echo "  cd ${EXT_DIR} && npx web-ext run"
  echo ""
  echo "To submit to AMO:"
  echo "  https://addons.mozilla.org/developers/"
fi
