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
# Setup typedoc
#

export PATH="${SCRIPT_DIR}/../typedoc/bin:${PATH}"
# Ensure this is installed to avoid parallel installs triggered by lerna run
typedoc --version

#
# Build
#

fold_start "yarn-docs"
yarn docs
fold_end
