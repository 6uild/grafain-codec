#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck > /dev/null && shellcheck "$0"

# Choose from https://hub.docker.com/r/iov1/tendermint/tags/
export GRAFAIN_TM_VERSION=v0.31.11-iov1
export GRAFAIN_VERSION=v0.2.3

# get this files directory regardless of pwd when we run it
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

GRAFAIN_DIR=$(mktemp -d "${TMPDIR:-/tmp}/grafain.XXXXXXXXX")
export GRAFAIN_DIR
echo "GRAFAIN_DIR = $GRAFAIN_DIR"

LOGS_FILE_TM="${TMPDIR:-/tmp}/grafain_tm.log"
LOGS_FILE_APP="${TMPDIR:-/tmp}/grafain_app.log"

"${SCRIPT_DIR}"/grafain_init.sh
"${SCRIPT_DIR}"/grafain_tm.sh > "$LOGS_FILE_TM" &
"${SCRIPT_DIR}"/grafain_app.sh > "$LOGS_FILE_APP" &

sleep 3
# for debug output
cat "$LOGS_FILE_TM"
cat "$LOGS_FILE_APP"

"${SCRIPT_DIR}"/init.sh
