#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck > /dev/null && shellcheck "$0"

if [ -z "$GRAFAIN_TM_VERSION" ]; then
  echo "GRAFAIN_TM_VERSION must be set"; exit 1
fi

if [ -z "$GRAFAIN_VERSION" ]; then
  echo "GRAFAIN_VERSION must be set"; exit 1
fi

if [ -z "$GRAFAIN_DIR" ]; then
  echo "GRAFAIN_DIR must be set"; exit 1
fi


chmod 777 "${GRAFAIN_DIR}"

docker run --rm \
  --user="$UID" \
  -v "${GRAFAIN_DIR}:/tendermint" \
  "iov1/tendermint:${GRAFAIN_TM_VERSION}" \
  init

mv "${GRAFAIN_DIR}/config/genesis.json" "${GRAFAIN_DIR}/config/genesis.json.orig"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_STATE=$(<"$SCRIPT_DIR/genesis_app_state.json")
# shellcheck disable=SC2002
cat "${GRAFAIN_DIR}/config/genesis.json.orig" \
  | jq '.chain_id = "local-grafain"' \
  | jq ". + {\"app_state\" : $APP_STATE}" \
  > "${GRAFAIN_DIR}/config/genesis.json"

sed -ie "/^\s*cors_allowed_origins /s/=.*$/= [\"*\"]/" "${GRAFAIN_DIR}/config/config.toml"
sed -ie "/^\s*allow_duplicate_ip /s/=.*$/= true/" "${GRAFAIN_DIR}/config/config.toml"
sed -ie "/^\s*index_all_tags /s/=.*$/= true/" "${GRAFAIN_DIR}/config/config.toml"
