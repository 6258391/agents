#!/bin/bash

# bootstrap
PY=python3
MJML_FILE="$1"
OUTPUT_FILE="${2:-${MJML_FILE%.mjml}.html}"

# dispatch
[ -f "$MJML_FILE" ] || { echo "MJML_FILE not found: $MJML_FILE" >&2; exit 2; }
npx mjml "$MJML_FILE" -o "$OUTPUT_FILE"
[ -f "$OUTPUT_FILE" ] || { echo "npx mjml failed; no HTML produced" >&2; exit 1; }

"$PY" - "$MJML_FILE" "$OUTPUT_FILE" <<'PYFACTS' >&2
import sys, os, re, json
mjml = open(sys.argv[1]).read()
html = open(sys.argv[2]).read()
print(json.dumps({
    'size_kb': round(os.path.getsize(sys.argv[2])/1024, 1),
    'mj_section_src': len(re.findall(r'<mj-section\b(?![^>]*/>)', mjml)),
    'mj_section_compiled': html.count('margin:0px auto;max-width:600px'),
    'border_radius_values': sorted(set(int(r) for r in re.findall(r'border-radius:\s*(\d+)px', html))),
    'vml_roundrect': len(re.findall(r'<v:roundrect', html)),
    'vml_rect': len(re.findall(r'<v:rect\b', html)),
    'mj_column_px': len(re.findall(r'class="mj-column-px-\d+"', html)),
    'color_scheme_meta': bool(re.search(r'<meta[^>]*name=["\']color-scheme["\']', html)),
}, indent=2))
PYFACTS

echo "$OUTPUT_FILE"
