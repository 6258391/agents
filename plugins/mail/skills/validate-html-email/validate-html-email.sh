#!/bin/bash
# bootstrap
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# dispatch
node "$SCRIPT_DIR/lib/runner.js" "$@"
