#!/bin/bash

MJML_FILE="$1"
OUTPUT_FILE="${MJML_FILE%.mjml}.html"

npx mjml "$MJML_FILE" -o "$OUTPUT_FILE"
