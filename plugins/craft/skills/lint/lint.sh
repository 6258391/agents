#!/usr/bin/env bash
# lint.sh — lint an agent or skill file against reference/rules.md
# Usage: lint.sh <path-to-file>
#
# Output format:
#   file:    <path>
#   type:    agent | skill
#   verdict: PASS | PENDING | FAIL
#
#   ## checks
#   [x] Rx.y DON'T ... Instead ... WHY ...
#   [ ] Rx.y DON'T ... Instead bash `...`. WHY ...
#       got: <reason>
#   [?] Rx.y DON'T ... Instead ... WHY ...
#
# Marker meaning:
#   [x] mech rule passed
#   [ ] mech rule failed
#   [?] sem rule — pending agent review (agent reads target file directly)

# bootstrap
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RULES_FILE="$SCRIPT_DIR/reference/rules.md"
FILE="$1"

# helpers

# block extraction
extract_frontmatter() {
  awk '/^---$/{c++; if(c==2) exit; next} c==1' <<< "$CONTENT"
}

extract_body() {
  awk '/^---$/{c++; next} c>=2' <<< "$CONTENT"
}

extract_field() {
  local key=$1
  awk -v k="$key" '
    $0 ~ "^"k":" {
      sub("^"k": *", "")
      gsub(/^"|"$/, "")
      print
      exit
    }
  ' <<< "$FRONTMATTER"
}

extract_section() {
  local section=$1
  awk -v sec="## $section" '
    $0 == sec { in_sec=1; next }
    in_sec && /^## / { exit }
    in_sec { print }
  ' <<< "$BODY"
}

extract_first_paragraph() {
  awk '
    /^---$/ { fm++; next }
    fm < 2 { next }
    /^## / { exit }
    /^$/ { if (started) exit; else next }
    { started=1; print }
  ' <<< "$CONTENT"
}

extract_first_line() {
  awk '
    /^---$/ { fm++; next }
    fm < 2 { next }
    /^## / { exit }
    /^# / { next }
    /^$/ { next }
    { print; exit }
  ' <<< "$CONTENT"
}

# target file parsing
parse_target_file() {
  CONTENT=$(cat "$FILE")

  case "$FILE" in
    *.sh)
      TYPE="shell"
      EXPECTED_NAME=$(basename "$FILE" .sh)
      return
      ;;
  esac

  FRONTMATTER=$(extract_frontmatter)
  BODY=$(extract_body)
  BODY_CLEAN=$(awk '/^```/{in_code=!in_code; next} !in_code' <<< "$BODY")
  NAME=$(extract_field name)
  DESCRIPTION=$(extract_field description)
  TOOLS=$(extract_field tools)
  SKILLS=$(extract_field skills)
  ALLOWED_TOOLS=$(extract_field allowed-tools)

  case "$FILE" in
    */skills/*)
      TYPE="skill"
      EXPECTED_NAME=$(basename "$(dirname "$FILE")")
      ;;
    */agents/*)
      TYPE="agent"
      EXPECTED_NAME=$(basename "$FILE" .md)
      ;;
  esac

  ROLE=""
  RULES_BLOCK=""
  SKILL_DEFS_BLOCK=""
  ONE_LINER=""
  FLOW_BLOCK=""
  EXAMPLES_BLOCK=""
  GOTCHAS_BLOCK=""

  if [[ "$TYPE" == "agent" ]]; then
    ROLE=$(extract_first_paragraph)
    RULES_BLOCK=$(extract_section "Rules & Constraints")
    SKILL_DEFS_BLOCK=$(extract_section "Skill Definitions")
  else
    ONE_LINER=$(extract_first_line)
    FLOW_BLOCK=$(extract_section "Flow")
    EXAMPLES_BLOCK=$(extract_section "Examples")
    GOTCHAS_BLOCK=$(extract_section "Gotchas")
  fi
}

# check functions referenced from rules.md; each emits "got: ..." to stderr on failure, returns 0 PASS, 1 FAIL
forbid_words() {
  local pattern=$1 text=$2 matches
  matches=$(grep -oiwE "$pattern" <<< "$text" | sort -u | tr '\n' ',' | sed 's/,$//')
  [[ -z "$matches" ]] && return 0
  echo "got: matched: $matches" >&2
  return 1
}

check_description_formula() {
  local sentences n=0 s words
  IFS='.' read -ra sentences <<< "$DESCRIPTION"
  for s in "${sentences[@]}"; do
    s="${s# }"
    s="${s% }"
    [[ -z "$s" ]] && continue
    n=$((n+1))
    read -ra words <<< "$s"
    if (( ${#words[@]} > 5 )); then
      echo "got: sentence '$s' has ${#words[@]} words, max 5" >&2
      return 1
    fi
  done
  if (( n != 3 )); then
    echo "got: $n sentences, expected exactly 3" >&2
    return 1
  fi
  return 0
}

check_agent_block_order() {
  local headings
  headings=$(grep -E '^## ' <<< "$BODY_CLEAN" || true)
  local seen_rules=0 seen_skills=0 seen_output=0
  while IFS= read -r h; do
    [[ -z "$h" ]] && continue
    case "$h" in
      "## Rules & Constraints")
        if (( seen_skills || seen_output )); then
          echo "got: Rules & Constraints appears after a later block" >&2
          return 1
        fi
        seen_rules=1
        ;;
      "## Skill Definitions")
        if (( ! seen_rules )) || (( seen_output )); then
          echo "got: Skill Definitions out of order" >&2
          return 1
        fi
        seen_skills=1
        ;;
      "## Output Format")
        if (( ! seen_rules )); then
          echo "got: Output Format before Rules & Constraints" >&2
          return 1
        fi
        seen_output=1
        ;;
      *)
        echo "got: unexpected heading '$h'" >&2
        return 1
        ;;
    esac
  done <<< "$headings"
  if (( ! seen_rules || ! seen_output )); then
    echo "got: missing required block (Rules & Constraints or Output Format)" >&2
    return 1
  fi
  return 0
}

check_skill_block_order() {
  local headings
  headings=$(grep -E '^## ' <<< "$BODY_CLEAN" || true)
  local seen_flow=0 seen_params=0 seen_examples=0
  while IFS= read -r h; do
    [[ -z "$h" ]] && continue
    case "$h" in
      "## Flow") seen_flow=1 ;;
      "## Params")
        if (( ! seen_flow )); then
          echo "got: Params before Flow" >&2
          return 1
        fi
        seen_params=1
        ;;
      "## Examples")
        if (( ! seen_params )); then
          echo "got: Examples before Params" >&2
          return 1
        fi
        seen_examples=1
        ;;
      "## Gotchas")
        if (( ! seen_examples )); then
          echo "got: Gotchas before Examples" >&2
          return 1
        fi
        ;;
    esac
  done <<< "$headings"
  if (( ! seen_flow || ! seen_params || ! seen_examples )); then
    echo "got: missing required block (Flow, Params, or Examples)" >&2
    return 1
  fi
  return 0
}

check_skill_allowed_blocks() {
  local extras
  extras=$(grep -E '^## ' <<< "$BODY_CLEAN" | grep -vE '^## (Flow|Params|Examples|Gotchas)$' || true)
  if [[ -n "$extras" ]]; then
    echo "got: disallowed blocks: $(tr '\n' ',' <<< "$extras")" >&2
    return 1
  fi
  return 0
}

check_rule_format() {
  local bad_line
  bad_line=$(grep -nE '^\*\*R[A-Z]*[0-9]+\.[0-9]+\*\*' <<< "$RULES_BLOCK" \
    | grep -v "DON'T .* Instead .* WHY .*" | head -1 || true)
  if [[ -n "$bad_line" ]]; then
    echo "got: malformed rule: $bad_line" >&2
    return 1
  fi
  local multi
  multi=$(grep -cE '\*\*R[A-Z]*[0-9]+\.[0-9]+\*\*.*\*\*R[A-Z]*[0-9]+\.[0-9]+\*\*' <<< "$RULES_BLOCK" || true)
  if (( multi > 0 )); then
    echo "got: $multi lines contain multiple rules" >&2
    return 1
  fi
  return 0
}

check_rule_numbering() {
  awk '
    /^### / { section=$0; last=0; next }
    /^\*\*R[A-Z]*[0-9]+\.[0-9]+\*\*/ {
      num = $0
      sub(/^\*\*R[A-Z]*[0-9]+\./, "", num)
      sub(/\*\*.*/, "", num)
      n = num + 0
      if (n != last + 1) {
        printf "got: section \"%s\" rule gap: expected %d, got %d\n", section, last+1, n > "/dev/stderr"
        exit 1
      }
      last = n
      next
    }
    /DON.?T .* Instead .* WHY / {
      printf "got: section \"%s\" rule missing **Rx.y** prefix: %s\n", section, $0 > "/dev/stderr"
      exit 1
    }
  ' <<< "$RULES_BLOCK"
}

check_rule_punctuation() {
  local line stripped dont instead why clause
  while IFS= read -r line; do
    [[ "$line" =~ ^\*\*R ]] || continue
    stripped=$(sed 's/`[^`]*`//g' <<< "$line")
    dont=$(sed -nE "s/.*DON'T (.+)\. Instead.*/\1/p" <<< "$stripped")
    instead=$(sed -nE 's/.*Instead (.+)\. WHY.*/\1/p' <<< "$stripped")
    why=$(sed -nE 's/.*WHY (.+)\.$/\1/p' <<< "$stripped")
    for clause in "$dont" "$instead" "$why"; do
      if [[ "$clause" == *.* || "$clause" == *\;* || "$clause" == *" - "* || "$clause" == *" — "* ]]; then
        echo "got: clause has extra punctuation: $clause" >&2
        return 1
      fi
    done
  done <<< "$RULES_BLOCK"
  return 0
}

check_rules_per_subsection() {
  awk '
    /^### / { section=$0; c[section]=0; next }
    /^\*\*R[A-Z]*[0-9]+\.[0-9]+\*\*/ { c[section]++ }
    END {
      for (s in c) {
        if (c[s] > 10) {
          printf "got: section \"%s\" has %d rules, max 10\n", s, c[s] > "/dev/stderr"
          exit 1
        }
      }
    }
  ' <<< "$RULES_BLOCK"
}

check_skills_match_definitions() {
  local fm_skills def_skills only_fm only_def
  fm_skills=$(echo "$SKILLS" | tr -d '[]"' | tr ',' '\n' | sed 's/^ *//;s/ *$//' | grep -v '^$' | sort -u || true)
  def_skills=$(grep -oE '^\*\*[a-z:-]+\*\*' <<< "$SKILL_DEFS_BLOCK" | tr -d '*' | sort -u || true)
  only_fm=$(comm -23 <(echo "$fm_skills") <(echo "$def_skills") | grep -v '^$' || true)
  only_def=$(comm -13 <(echo "$fm_skills") <(echo "$def_skills") | grep -v '^$' || true)
  if [[ -n "$only_fm" ]]; then
    echo "got: skills[] has entries without definitions: $(tr '\n' ',' <<< "$only_fm")" >&2
    return 1
  fi
  if [[ -n "$only_def" ]]; then
    echo "got: Skill Definitions has entries not in skills[]: $(tr '\n' ',' <<< "$only_def")" >&2
    return 1
  fi
  return 0
}

check_gotchas_score() {
  local score=10
  local count
  count=$(grep -cE '^- ' <<< "$GOTCHAS_BLOCK" 2>/dev/null || echo 0)

  # C1: at least 3 gotchas
  if (( count < 3 )); then
    echo "got: C1 score -1: fewer than 3 gotchas ($count)" >&2
    score=$((score-1))
  fi

  # C2: at most 13 gotchas
  if (( count > 13 )); then
    echo "got: C2 score -1: more than 13 gotchas ($count)" >&2
    score=$((score-1))
  fi

  # C3: every gotcha has 'instead of'
  if grep -E '^- ' <<< "$GOTCHAS_BLOCK" | grep -qvE 'instead of'; then
    echo "got: C3 score -1: gotcha missing 'instead of' clause" >&2
    score=$((score-1))
  fi

  # C4: every gotcha has 'because'
  if grep -E '^- ' <<< "$GOTCHAS_BLOCK" | grep -qvE '\bbecause\b'; then
    echo "got: C4 score -1: gotcha missing 'because' clause" >&2
    score=$((score-1))
  fi

  # C5: 'instead of' precedes 'because' in every gotcha
  local c5_fail
  c5_fail=$(grep -E '^- ' <<< "$GOTCHAS_BLOCK" | awk '{
    io=index($0,"instead of"); bc=index($0,"because")
    if(io>0 && bc>0 && bc<io){print; exit}
  }')
  if [[ -n "$c5_fail" ]]; then
    echo "got: C5 score -1: 'because' before 'instead of': $c5_fail" >&2
    score=$((score-1))
  fi

  # C6: no vague adverbs
  if grep -E '^- ' <<< "$GOTCHAS_BLOCK" | grep -qiE '\b(properly|correctly|appropriately|simply|easily)\b'; then
    echo "got: C6 score -1: vague adverb in gotcha" >&2
    score=$((score-1))
  fi

  # C7: no gotcha exceeds 30 words
  local c7_fail
  c7_fail=$(grep -E '^- ' <<< "$GOTCHAS_BLOCK" | awk '{sub(/^- /,""); n=split($0,a," "); if(n>30){print n" words: "$0; exit}}')
  if [[ -n "$c7_fail" ]]; then
    echo "got: C7 score -1: gotcha exceeds 30 words: $c7_fail" >&2
    score=$((score-1))
  fi

  # C8: 'because' clause has at least 4 words
  local c8_fail
  c8_fail=$(grep -E '^- ' <<< "$GOTCHAS_BLOCK" | awk '{
    idx=index($0,"because ")
    if(idx>0){rest=substr($0,idx+8); n=split(rest,a," "); if(n<4){print n" words after because: "$0; exit}}
  }')
  if [[ -n "$c8_fail" ]]; then
    echo "got: C8 score -1: 'because' clause too short: $c8_fail" >&2
    score=$((score-1))
  fi

  # C9: no duplicate first 3 content words across gotchas
  local c9_fail
  c9_fail=$(grep -E '^- ' <<< "$GOTCHAS_BLOCK" | awk '{print $2,$3,$4}' | sort | uniq -d | head -1)
  if [[ -n "$c9_fail" ]]; then
    echo "got: C9 score -1: duplicate gotcha opening: '$c9_fail'" >&2
    score=$((score-1))
  fi

  # C10: no hedging in 'because' clause
  local c10_fail
  c10_fail=$(grep -E '^- ' <<< "$GOTCHAS_BLOCK" | grep -iE 'because.*(might|could|may|sometimes|often|usually)' | head -1)
  if [[ -n "$c10_fail" ]]; then
    echo "got: C10 score -1: hedging word in 'because' clause" >&2
    score=$((score-1))
  fi

  echo "got: score $score/10" >&2
  [[ $score -eq 10 ]]
}

check_flow_step_length() {
  awk '
    /^[0-9]+\. / {
      line = $0
      while (match(line, /`[^`]*`/)) {
        line = substr(line, 1, RSTART-1) substr(line, RSTART+RLENGTH)
      }
      sub(/^[0-9]+\. /, "", line)
      n = split(line, words, " ")
      if (n > 8) {
        printf "got: flow step has %d words, max 8: %s\n", n, $0 > "/dev/stderr"
        exit 1
      }
    }
  ' <<< "$FLOW_BLOCK"
}

# rule runner
RESULTS=()

run_rules() {
  local line current_scope="" current_section=""
  while IFS= read -r line; do
    case "$line" in
      "## Shared rules")        current_scope="shared"; continue ;;
      "## Agent rules")         current_scope="agent";  continue ;;
      "## Skill rules")         current_scope="skill";  continue ;;
      "## Shell script rules")  current_scope="shell";  continue ;;
      "### "*)                  current_section="${line#"### "}"; continue ;;
    esac
    [[ "$line" =~ ^\*\*R ]] || continue
    if [[ "$TYPE" == "shell" ]]; then
      [[ "$current_scope" == "shell" ]] || continue
    elif [[ "$current_scope" != "shared" && "$current_scope" != "$TYPE" ]]; then
      continue
    fi
    eval_rule "$line"
  done < "$RULES_FILE"
}

eval_rule() {
  local line="$1" id text rest expr err entry eline
  id=$(grep -oE '^\*\*R[A-Z]*[0-9]+\.[0-9]+\*\*' <<< "$line" | tr -d '*')
  text=$(sed -E 's/^\*\*[^*]+\*\* //' <<< "$line")

  if [[ "$line" == *"Instead bash \`"* ]]; then
    rest="${line#*Instead bash \`}"
    expr="${rest%%\`*}"
    if err=$(eval "$expr" 2>&1); then
      RESULTS+=("[x] $id $text")
    else
      entry="[ ] $id $text"
      [[ -z "$err" ]] && err="got: expression returned non-zero"
      while IFS= read -r eline; do
        entry+=$'\n'"    $eline"
      done <<< "$err"
      RESULTS+=("$entry")
    fi
  else
    RESULTS+=("[?] $id $text")
  fi
}

# output
emit_output() {
  local pass=0 fail=0 pending=0 r verdict
  for r in "${RESULTS[@]}"; do
    case "$r" in
      '[x]'*) pass=$((pass+1)) ;;
      '[ ]'*) fail=$((fail+1)) ;;
      '[?]'*) pending=$((pending+1)) ;;
    esac
  done

  if (( fail > 0 )); then
    verdict="FAIL ($fail fail, $pending pending, $pass pass)"
  elif (( pending > 0 )); then
    verdict="PENDING ($pending pending, $pass pass)"
  else
    verdict="PASS ($pass pass)"
  fi

  printf 'file:    %s\n' "$FILE"
  printf 'type:    %s\n' "$TYPE"
  printf 'verdict: %s\n' "$verdict"
  echo
  echo "## checks"
  echo
  for r in "${RESULTS[@]}"; do
    echo "$r"
  done
}

# dispatch
parse_target_file
run_rules
emit_output
