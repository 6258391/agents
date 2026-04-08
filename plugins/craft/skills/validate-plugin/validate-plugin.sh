#!/bin/bash
dir="$1"
errors=()

# Manifest
[[ -f "$dir/.claude-plugin/plugin.json" ]] || errors+=(".claude-plugin/plugin.json missing")

# .claude-plugin/ must contain only plugin.json
for f in "$dir"/.claude-plugin/*; do
  [[ "$(basename "$f")" == "plugin.json" ]] || errors+=(".claude-plugin/ has unexpected item: $(basename "$f")")
done

# Component dirs must NOT be inside .claude-plugin/
for d in commands agents skills hooks bin; do
  [[ -d "$dir/.claude-plugin/$d" ]] && errors+=("$d/ found inside .claude-plugin/ — must be at plugin root")
done

# Each skill dir must have SKILL.md
if [[ -d "$dir/skills" ]]; then
  for skill_dir in "$dir"/skills/*/; do
    [[ -d "$skill_dir" ]] && [[ ! -f "${skill_dir}SKILL.md" ]] && errors+=("skills/$(basename "$skill_dir")/ missing SKILL.md")
  done
fi

# Report
if [[ ${#errors[@]} -eq 0 ]]; then
  echo "PASS"
  exit 0
fi

for e in "${errors[@]}"; do
  echo "FAIL: $e"
done
exit 1
