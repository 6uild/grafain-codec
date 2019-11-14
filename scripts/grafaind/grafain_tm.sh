#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck > /dev/null && shellcheck "$0"

PORT=23456

if [ -z "$GRAFAIN_TM_VERSION" ]; then
  echo "GRAFAIN_TM_VERSION must be set"; exit 1
fi

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

# tx indexing set in init
exec docker run --rm \
  --user="$UID" \
  --name "grafain-tendermint" \
  -p "${PORT}:26657" -v "${GRAFAIN_DIR}:/tendermint" \
  "iov1/tendermint:${GRAFAIN_TM_VERSION}" node \
  --proxy_app="unix:///tendermint/app.sock" \
  --rpc.laddr=tcp://0.0.0.0:26657 \
  --log_level=state:info,rpc:info,*:error
