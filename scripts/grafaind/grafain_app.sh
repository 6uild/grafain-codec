#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck > /dev/null && shellcheck "$0"

if [ -z "$GRAFAIN_VERSION" ]; then
  echo "GRAFAIN_VERSION must be set"; exit 1
fi

if [ -z "$GRAFAIN_DIR" ]; then
  echo "GRAFAIN_DIR must be set"; exit 1
fi

# this assumes it was run after grafain_init.sh and this exists
if [ ! -d "${GRAFAIN_DIR}" ]; then
  echo "Error: directory not created for grafain"; exit 1;
fi

exec docker run --rm \
  --user="$UID" \
  --name "grafain-app" \
  -v "${GRAFAIN_DIR}:/data" \
  "alpetest/grafain:${GRAFAIN_VERSION}" \
   -admission-hook=false \
   -home "/data" \
   start -bind="unix:///data/app.sock"
