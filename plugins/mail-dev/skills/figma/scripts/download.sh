#!/bin/bash
# Usage: FIGMA_TOKEN=xxx download-figma.sh <FILE_KEY>   (run from project dir)
set -e
mkdir -p .workspace/figma_cache
curl -sf -H "X-Figma-Token: $FIGMA_TOKEN" "https://api.figma.com/v1/files/$1" -o .workspace/figma_cache/full.json
