#!/bin/bash

MODE="$1"

case "$MODE" in
  tree)
    FILE_KEY="$2"
    curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
      "https://api.figma.com/v1/files/$FILE_KEY"
    ;;
  images)
    FILE_KEY="$2"
    NODE_IDS="$3"
    FORMAT="${4:-png}"
    SCALE="${5:-2}"
    curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
      "https://api.figma.com/v1/images/$FILE_KEY?ids=$NODE_IDS&format=$FORMAT&scale=$SCALE"
    ;;
  download)
    URL="$2"
    OUTPUT_PATH="$3"
    curl -s -o "$OUTPUT_PATH" "$URL"
    ;;
esac
