#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck > /dev/null && shellcheck "$0"

#
# Includes
#

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# shellcheck disable=SC1090
source "$SCRIPT_DIR/_includes.sh";

#
# Install
#

#
# Start blockchains
#

# Use Docker if available (currently Linux only)
if command -v docker > /dev/null ; then
  fold_start "grafaind-start"
  ./scripts/grafaind/start.sh
  export GRAFAIND_ENABLED=1
  fold_end
fi

#
# Start faucet
#
#if [[ -n ${FAUCET_ENABLED:-} ]]; then
#  fold_start "faucet-start"
#  ./scripts/iov_faucet_start.sh
#  export FAUCET_ENABLED=1
#  fold_end
#fi

echo "use grafaind? ${GRAFAIND_ENABLED:-no}"
echo "use faucet? ${FAUCET_ENABLED:-no}"

#
# Build
#
fold_start "yarn-build"
yarn build
fold_end

fold_start "check-dirty"
# Ensure build step didn't modify source files to avoid outdated .d.ts files
SOURCE_CHANGES=$(git status --porcelain)
if [[ -n "$SOURCE_CHANGES" ]]; then
  echo "Error: repository contains changes."
  echo "Showing 'git status' and 'git diff' for debugging reasons now:"
  git status
  git diff
  exit 1
fi
fold_end

export SKIP_BUILD=1

if [[ "$MODE" == "tests-chrome" ]]; then
  fold_start "test-chrome"
  yarn run test-chrome
  fold_end
elif [[ "$MODE" == "tests-firefox" ]]; then
  # A version of Firefox is preinstalled on Linux VMs and can be used via xvfb
  fold_start "test-firefox"
  xvfb-run --auto-servernum yarn run test-firefox
  fold_end
else
  #
  # Tests
  #

  fold_start "commandline-tests"
  yarn test
  fold_end

fi


#
# Cleanup
#
#if [[ -n ${FAUCET_ENABLED:-} ]]; then
#  fold_start "faucet-stop"
#  unset FAUCET_ENABLED
#  ./scripts/iov_faucet_stop.sh
#  fold_end
#fi

if [[ -n ${GRAFAIND_ENABLED:-} ]]; then
  fold_start "grafaind-stop"
  unset GRAFAIND_ENABLED
  ./scripts/grafaind/stop.sh
  fold_end
fi
