#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck > /dev/null && shellcheck "$0"

echo "Killing GRAFAIN containers ..."
docker rm -f "grafain-app" "grafain-tendermint"
