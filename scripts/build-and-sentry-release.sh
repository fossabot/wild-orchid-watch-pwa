#!/bin/bash
# builds our app and performs a Sentry.io release
set -euxo pipefail
cd `dirname "$0"`
thisDir=`pwd`

: ${SENTRY_AUTH_TOKEN:?}
: ${SENTRY_ORG:?}
: ${SENTRY_PROJECT:?}

$thisDir/gen-version.sh
export VUE_APP_VERSION=`node -e "ver = require('./current-version.js'); console.log(ver)"`

$thisDir/add-dev-markings-if-required.sh pre-build

cd ..
export DO_SENTRY_RELEASE=true
# Sentry release happens in a webpack plugin
# see vue-config/config.production.js for details
yarn build

$thisDir/add-dev-markings-if-required.sh post-build
