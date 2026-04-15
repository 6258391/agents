#!/bin/bash
# test.sh — run every fixture, diff runner output vs expected.txt

# bootstrap
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATOR="$SCRIPT_DIR/../validate-html-email.sh"
FIXTURES="$SCRIPT_DIR/fixtures"

# helpers
_run_fixture() {
  local dir="$1"
  local name
  name=$(basename "$dir")
  local input="$dir/input.html"
  local profile_file="$dir/profile"
  local params_file="$dir/params"
  local expected="$dir/expected.txt"

  if [ ! -f "$expected" ]; then
    echo "SKIP $name (no expected.txt)"
    return 2
  fi
  if [ ! -f "$input" ] || [ ! -f "$profile_file" ]; then
    echo "SKIP $name (missing input.html or profile)"
    return 2
  fi

  local profile
  profile=$(head -1 "$profile_file")
  local args=("$input" "$profile")
  if [ -f "$params_file" ]; then
    while IFS='=' read -r key val; do
      [ -z "$key" ] && continue
      args+=("--${key//_/-}" "$val")
    done < "$params_file"
  fi

  local actual
  actual=$("$VALIDATOR" "${args[@]}" | sed "s|^file:.*|file:    {FIXTURE}|")
  local expected_content
  expected_content=$(cat "$expected")

  if [ "$actual" = "$expected_content" ]; then
    echo "PASS $name"
    return 0
  fi
  echo "FAIL $name"
  diff <(echo "$actual") <(echo "$expected_content") | head -60
  return 1
}

# dispatch
mode="${1:-run}"
passed=0
failed=0
skipped=0

for dir in "$FIXTURES"/*/; do
  if [ "$mode" = "record" ]; then
    name=$(basename "$dir")
    input="$dir/input.html"
    profile_file="$dir/profile"
    params_file="$dir/params"
    [ ! -f "$input" ] || [ ! -f "$profile_file" ] && { echo "SKIP $name (P0 placeholder)"; continue; }
    profile=$(head -1 "$profile_file")
    args=("$input" "$profile")
    if [ -f "$params_file" ]; then
      while IFS='=' read -r key val; do
        [ -z "$key" ] && continue
        args+=("--${key//_/-}" "$val")
      done < "$params_file"
    fi
    "$VALIDATOR" "${args[@]}" | sed "s|^file:.*|file:    {FIXTURE}|" > "$dir/expected.txt"
    echo "RECORDED $name"
    continue
  fi

  _run_fixture "$dir"
  rc=$?
  case $rc in
    0) passed=$((passed + 1)) ;;
    1) failed=$((failed + 1)) ;;
    2) skipped=$((skipped + 1)) ;;
  esac
done

echo
echo "Total: passed=$passed failed=$failed skipped=$skipped"
exit $failed
