#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# This installs the actual Google Chrome stable binary into the Render OS
if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then
  echo "...Installing Google Chrome Stable..."
  npx puppeteer browsers install chrome
fi