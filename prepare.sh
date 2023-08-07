#!/usr/bin/env bash

export VERSION="$1"
export PKG="web-ext-artifacts/lume_web-${VERSION}.zip"
export PKG_SRC="web-ext-artifacts/lume_web-${VERSION}-src.zip"
yq -i '.version = strenv(VERSION)' assets/manifest.json
cp assets/manifest.json dist/
web-ext build -s dist
mkdir -p dist-src
cp -r assets shared src ui *.json .js dist-src/
zip -r "web-ext-artifacts/lume_web-${VERSION}-src.zip" dist-src/

echo "EXTENSION_VERSION=${VERSION}" >> $GITHUB_ENV
echo "PKG=${PKG}" >> $GITHUB_ENV
echo "PKG_SRC=${PKG_SRC}" >> $GITHUB_ENV
