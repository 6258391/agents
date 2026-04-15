#!/bin/bash

# bootstrap
PY=python3
MODE="$1"

# helpers
_cache_path() {
  echo "/tmp/figma-tree-$1-$(echo "$2" | tr ':,' '-_').json"
}

# dispatch
case "$MODE" in
  tree)
    FILE_KEY="$2"
    IDS="${3//-/:}"
    RAW_JSON=$(_cache_path "$FILE_KEY" "$IDS")
    URL="https://api.figma.com/v1/files/$FILE_KEY/nodes?ids=$IDS"
    curl --fail-with-body -s -o "$RAW_JSON" -H "X-Figma-Token: $FIGMA_TOKEN" "$URL" \
      || { rc=$?; [ -f "$RAW_JSON" ] && { cat "$RAW_JSON" >&2; echo >&2; }; echo "curl exit=$rc url=$URL" >&2; exit 3; }
    "$PY" - "$RAW_JSON" <<'PYTREE'
import json, sys

with open(sys.argv[1]) as f:
    data = json.load(f)

def describe(n, indent=0):
    p = '  ' * indent
    t = n.get('type','?')
    nid = n.get('id','')
    name = n.get('name','')
    bbox = n.get('absoluteBoundingBox', {})
    w, h = int(bbox.get('width', 0)), int(bbox.get('height', 0))
    fills = n.get('fills', [])
    style = n.get('style', {})
    chars = n.get('characters', '')

    hidden = n.get('visible') is False or (n.get('opacity') is not None and n.get('opacity') <= 0)
    tags = ['HIDDEN'] if hidden else []
    for f in fills:
        ft = f.get('type','')
        if ft == 'IMAGE': tags.append('IMAGE')
        elif ft == 'GRADIENT_LINEAR': tags.append('GRADIENT')
        else:
            c = f.get('color', {})
            if c:
                r,g,b = int(c.get('r',0)*255), int(c.get('g',0)*255), int(c.get('b',0)*255)
                tags.append(f'#{r:02x}{g:02x}{b:02x}')
    if style:
        fn = style.get('fontFamily','')
        fs = style.get('fontSize','')
        if fn: tags.append(f'{fn} {fs}px')

    tag_str = f' [{", ".join(tags)}]' if tags else ''
    dim = f' {w}x{h}' if w else ''
    line = f'{p}{t} {nid} "{name}"{dim}{tag_str}'
    if chars:
        preview = chars[:100].replace(chr(10), ' | ')
        line += f' -> "{preview}"'
    print(line)
    for child in n.get('children', []):
        describe(child, indent+1)

for node_id, node_data in data.get('nodes', {}).items():
    doc = node_data.get('document')
    if doc:
        describe(doc)

print(f'\nRaw JSON saved at: {sys.argv[1]}')
PYTREE
    ;;
  images)
    FILE_KEY="$2"
    IDS="$3"
    FORMAT="${4:-png}"
    SCALE="${5:-2}"
    curl --fail-with-body -s -H "X-Figma-Token: $FIGMA_TOKEN" \
      "https://api.figma.com/v1/images/$FILE_KEY?ids=$IDS&format=$FORMAT&scale=$SCALE" \
      || { rc=$?; echo "curl exit=$rc" >&2; exit 3; }
    ;;
  download)
    URL="$2"
    OUTPUT_PATH="$3"
    curl --fail-with-body -s -o "$OUTPUT_PATH" "$URL" \
      || { rc=$?; echo "curl exit=$rc url=$URL" >&2; [ -f "$OUTPUT_PATH" ] && { head -c 500 "$OUTPUT_PATH" >&2; echo >&2; rm -f "$OUTPUT_PATH"; }; exit 3; }
    ;;
  structure)
    FILE_KEY="$2"
    IDS="${3//-/:}"
    RAW_JSON=$(_cache_path "$FILE_KEY" "$IDS")
    "$PY" - "$RAW_JSON" <<'PYSTRUCTURE'
import json, sys

EPS = 0.5

with open(sys.argv[1]) as f:
    data = json.load(f)

def bbox(n):
    b = n.get('absoluteBoundingBox') or {}
    return b.get('x', 0), b.get('y', 0), b.get('width', 0), b.get('height', 0)

def is_hidden(n):
    if n.get('visible') is False: return True
    op = n.get('opacity')
    if op is not None and op <= 0: return True
    _, _, w, h = bbox(n)
    if w <= 0 or h <= 0: return True
    return False

def is_overflow(child, parent):
    cx, cy, cw, ch = child
    px, py, pw, ph = parent
    return (cx < px - EPS or cy < py - EPS or
            cx + cw > px + pw + EPS or cy + ch > py + ph + EPS)

def iou(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    ix = max(0, min(ax + aw, bx + bw) - max(ax, bx))
    iy = max(0, min(ay + ah, by + bh) - max(ay, by))
    inter = ix * iy
    if inter == 0: return 0
    union = aw * ah + bw * bh - inter
    return inter / union if union > 0 else 0

def walk(node, parent_bb, depth):
    if is_hidden(node): return
    self_bb = bbox(node)
    x, y, w, h = self_bb
    flags = []

    if parent_bb and is_overflow(self_bb, parent_bb):
        flags.append('!overflow')

    kids = [c for c in node.get('children', []) if not is_hidden(c)]
    kid_bbs = [bbox(c) for c in kids]

    if len(kids) == 1 and node.get('type') != 'INSTANCE':
        flags.append('!single')

    if len(kids) >= 2:
        ious = []
        for i in range(len(kids)):
            for j in range(i + 1, len(kids)):
                ious.append(iou(kid_bbs[i], kid_bbs[j]))
        if all(v >= 0.8 for v in ious):
            flags.append('!stack')
        elif any(v > 0 for v in ious):
            flags.append('!overlap')

    if any(is_overflow(kb, self_bb) for kb in kid_bbs):
        flags.append('!oob-parent')

    if parent_bb:
        ox, oy = x - parent_bb[0], y - parent_bb[1]
        off = f'+{int(ox)},{int(oy)}'
    else:
        off = '+0,0'

    kind = 'CONTAINER' if kids else 'LEAF'
    t = node.get('type', '?')
    nid = node.get('id', '')
    name = node.get('name', '')
    flag_str = ' ' + ' '.join(flags) if flags else ''
    indent = '  ' * depth
    print(f'{indent}{kind} {t} {nid} "{name}" {off} {int(w)}x{int(h)}{flag_str}')

    for c in kids:
        walk(c, self_bb, depth + 1)

for nid, nd in data.get('nodes', {}).items():
    doc = nd.get('document')
    if not doc: continue
    print('=' * 60)
    print(f'  {doc.get("name")} ({doc.get("id")})')
    print('=' * 60)
    walk(doc, None, 0)
PYSTRUCTURE
    ;;
  analyze)
    FILE_KEY="$2"
    IDS="${3//-/:}"
    RAW_JSON=$(_cache_path "$FILE_KEY" "$IDS")
    "$PY" - "$RAW_JSON" "$IDS" <<'PYANALYZE'
import json, sys

json_path = sys.argv[1]
ids_arg = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else ''
node_ids = [nid.strip() for nid in ids_arg.split(',') if nid.strip()]

with open(json_path) as f:
    data = json.load(f)

# ── helpers ──

def rgba_to_hex(c):
    r, g, b = int(c.get('r',0)*255), int(c.get('g',0)*255), int(c.get('b',0)*255)
    return f'#{r:02x}{g:02x}{b:02x}'

def get_bbox(node):
    bb = node.get('absoluteBoundingBox', {})
    return bb.get('x',0), bb.get('y',0), bb.get('width',0), bb.get('height',0)

def has_image_fill(node):
    return any(f.get('type') == 'IMAGE' for f in node.get('fills', []))

def has_gradient_fill(node):
    return any('GRADIENT' in f.get('type','') for f in node.get('fills', []))

def has_opacity(node):
    op = node.get('opacity')
    return op is not None and op < 1.0

def has_rotation(node):
    r = node.get('rotation')
    return r is not None and abs(r) > 0.01

def has_effects(node):
    return len(node.get('effects', [])) > 0

def has_visible_radius(node):
    r = node.get('cornerRadius') or 0
    if r <= 0:
        return False
    if node.get('clipsContent'):
        return True
    _, _, w, h = get_bbox(node)
    if w and h and r >= min(w, h) / 2:
        return True
    my_bg = get_fill_color(node)
    if my_bg:
        nid = node.get('id')
        if nid in parent_map:
            parent_bg = get_fill_color(all_nodes[parent_map[nid]])
            if my_bg != parent_bg:
                return True
    return False

def has_radius_needs_review(node):
    r = node.get('cornerRadius') or 0
    if r <= 0:
        return False
    return not has_visible_radius(node)

def children_overlap(node):
    kids = node.get('children', [])
    if len(kids) < 2:
        return False
    boxes = []
    for c in kids:
        x, y, w, h = get_bbox(c)
        if w and h:
            boxes.append((x, y, x+w, y+h))
    for i in range(len(boxes)):
        for j in range(i+1, len(boxes)):
            a, b = boxes[i], boxes[j]
            ox = min(a[2], b[2]) - max(a[0], b[0])
            oy = min(a[3], b[3]) - max(a[1], b[1])
            if ox > 0 and oy > 0:
                return True
    return False

def clips_children(node):
    if not node.get('clipsContent'):
        return False
    px, py, pw, ph = get_bbox(node)
    if not pw:
        return False
    for c in node.get('children', []):
        cx, cy, cw, ch = get_bbox(c)
        if cw and ch:
            if cx < px - 0.5 or cy < py - 0.5 or cx+cw > px+pw + 0.5 or cy+ch > py+ph + 0.5:
                return True
    return False

def get_fill_color(node):
    for f in node.get('fills', []):
        if f.get('type') == 'SOLID' and f.get('color'):
            return rgba_to_hex(f['color'])
    return None

# ── flatten tree, build parent map ──

all_nodes = {}
parent_map = {}

def is_hidden(node):
    if node.get('visible') is False:
        return True
    op = node.get('opacity')
    if op is not None and op <= 0:
        return True
    _, _, w, h = get_bbox(node)
    if w <= 0 or h <= 0:
        return True
    return False

def flatten(node, parent_id=None):
    if is_hidden(node):
        return
    nid = node.get('id')
    all_nodes[nid] = node
    if parent_id:
        parent_map[nid] = parent_id
    node['children'] = [c for c in node.get('children', []) if not is_hidden(c)]
    for c in node['children']:
        flatten(c, nid)

# ── classify leaves ──

def is_leaf(node):
    return len(node.get('children', [])) == 0

def classify_leaf(node):
    ntype = node.get('type', '')
    if ntype == 'VECTOR':
        return ('IMAGE', 'vector/icon')
    if has_image_fill(node):
        return ('IMAGE', 'image fill')
    if ntype == 'TEXT':
        reasons = []
        if has_effects(node):
            reasons.append('text has effects (shadow/blur)')
        if has_opacity(node):
            reasons.append(f'opacity {node.get("opacity")}')
        if has_rotation(node):
            reasons.append('rotated')
        if reasons:
            return ('IMAGE', ', '.join(reasons))
        return ('TEXT', None)
    if has_gradient_fill(node):
        return ('IMAGE', 'gradient fill')
    if has_opacity(node):
        return ('IMAGE', f'opacity {node.get("opacity")}')
    if ntype == 'RECTANGLE' and get_fill_color(node):
        return ('SKIP', 'solid rectangle, renderable as bg/border')
    return ('SKIP', None)

# ── bubble up ──

def check_parent_special(node):
    reasons = []
    if has_visible_radius(node):
        reasons.append(f'radius {node.get("cornerRadius")}px')
    if has_gradient_fill(node):
        reasons.append('gradient fill')
    if has_image_fill(node):
        reasons.append('background image fill')
    if children_overlap(node):
        reasons.append('children overlap')
    if has_opacity(node):
        reasons.append(f'opacity {node.get("opacity")}')
    if has_rotation(node):
        reasons.append('rotated')
    if clips_children(node):
        reasons.append('clips overflowing children')
    return reasons

def find_export_target(leaf_id):
    current_id = leaf_id
    all_reasons = []
    while current_id in parent_map:
        pid = parent_map[current_id]
        parent = all_nodes[pid]
        reasons = check_parent_special(parent)
        if reasons:
            all_reasons.extend(reasons)
            current_id = pid
        else:
            break
    return current_id, all_reasons

# ── grouping ──

def check_image_only_parent(node):
    children = node.get('children', [])
    if not children:
        return False
    if not has_image_descendant(node):
        return False
    for c in children:
        if is_leaf(c):
            cls, _ = classify_leaf(c)
            if cls == 'TEXT':
                return False
        else:
            if has_text_descendant(c):
                return False
    if len(children) == 1:
        return True
    return children_overlap(node)

def is_descendant_of_node(child_id, ancestor_id):
    cid = child_id
    while cid in parent_map:
        cid = parent_map[cid]
        if cid == ancestor_id:
            return True
    return False

def has_text_descendant(node):
    if is_leaf(node):
        cls, _ = classify_leaf(node)
        return cls == 'TEXT'
    return any(has_text_descendant(c) for c in node.get('children', []))

def has_image_descendant(node):
    if is_leaf(node):
        cls, _ = classify_leaf(node)
        return cls == 'IMAGE'
    return any(has_image_descendant(c) for c in node.get('children', []))

# ── run analysis ──

def analyze(root):
    flatten(root)

    leaf_exports = {}
    for nid, node in all_nodes.items():
        if is_leaf(node):
            cls, reason = classify_leaf(node)
            if cls != 'SKIP':
                leaf_exports[nid] = (cls, reason)

    export_targets = {}
    text_entries = []

    for leaf_id, (cls, leaf_reason) in leaf_exports.items():
        if cls == 'IMAGE':
            target_id, parent_reasons = find_export_target(leaf_id)
            if target_id in parent_map:
                gp_id = parent_map[target_id]
                gp = all_nodes[gp_id]
                if check_image_only_parent(gp):
                    target_id = gp_id
                    parent_reasons.append('parent contains only image-type children')
            further_id, further_reasons = find_export_target(target_id)
            if further_id != target_id:
                target_id = further_id
                parent_reasons.extend(further_reasons)
            if target_id not in export_targets:
                node = all_nodes[target_id]
                _, _, w, h = get_bbox(node)
                export_targets[target_id] = {
                    'node': node, 'reasons': set(), 'leaf_reasons': set(),
                    'dim': f'{int(w)}x{int(h)}',
                }
            export_targets[target_id]['leaf_reasons'].add(leaf_reason)
            for r in parent_reasons:
                export_targets[target_id]['reasons'].add(r)
        elif cls == 'TEXT':
            target_id, parent_reasons = find_export_target(leaf_id)
            if parent_reasons:
                if target_id not in export_targets:
                    node = all_nodes[target_id]
                    _, _, w, h = get_bbox(node)
                    export_targets[target_id] = {
                        'node': node, 'reasons': set(), 'leaf_reasons': set(),
                        'dim': f'{int(w)}x{int(h)}',
                    }
                for r in parent_reasons:
                    export_targets[target_id]['reasons'].add(r)
                export_targets[target_id]['leaf_reasons'].add(f'absorbs text: "{all_nodes[leaf_id].get("characters","")[:40]}"')
            else:
                text_entries.append(leaf_id)

    # ── collect NEEDS REVIEW ──

    review_items = []

    root_id = root.get('id')
    if root_id in export_targets:
        kids = root.get('children', [])
        overlaps = []
        boxes = [(c.get('name',''), c.get('id',''), *get_bbox(c)) for c in kids]
        for i in range(len(boxes)):
            for j in range(i+1, len(boxes)):
                a, b = boxes[i], boxes[j]
                ox = min(a[2]+a[4], b[2]+b[4]) - max(a[2], b[2])
                oy = min(a[3]+a[5], b[3]+b[5]) - max(a[3], b[3])
                if ox > 0 and oy > 0:
                    overlaps.append(f'"{a[0]}" vs "{b[0]}" ({int(ox)}x{int(oy)}px)')
        review_items.append({
            'issue': 'Entire email collapsed into 1 image',
            'node': root.get('name',''), 'id': root_id,
            'action': 'Fix overlapping sections in Figma, re-run'
        })

    for nid, node in all_nodes.items():
        if has_radius_needs_review(node) and len(node.get('children', [])) > 0:
            review_items.append({
                'issue': 'Ambiguous cornerRadius',
                'node': node.get('name',''), 'id': nid,
                'action': 'If radius is visually meaningful → export as image. If invisible → ignore.'
            })

    for nid, node in all_nodes.items():
        children = node.get('children', [])
        if len(children) <= 1: continue
        if children_overlap(node): continue
        if has_text_descendant(node): continue
        if not has_image_descendant(node): continue
        if any(is_descendant_of_node(nid, tid) for tid in export_targets): continue
        child_ids = {c.get('id') for c in children}
        exported_children = child_ids & set(export_targets.keys())
        if len(exported_children) >= 2:
            review_items.append({
                'issue': 'Multiple image elements not grouped',
                'node': node.get('name',''), 'id': nid,
                'action': 'If these form 1 visual unit → export parent as single image. If independent → keep separate.'
            })

    # ── dedup ──

    def is_descendant_of(child_id, ancestor_id):
        cid = child_id
        while cid in parent_map:
            cid = parent_map[cid]
            if cid == ancestor_id:
                return True
        return False

    target_ids = set(export_targets.keys())
    redundant = set()
    for tid in target_ids:
        for other_tid in target_ids:
            if tid != other_tid and is_descendant_of(tid, other_tid):
                redundant.add(tid)
    for rid in redundant:
        del export_targets[rid]

    text_entries = [t for t in text_entries if not any(is_descendant_of(t, tid) for tid in export_targets)]

    # ── output ──

    print()
    print('IMAGE EXPORTS')
    print('─' * 60)

    for tid, info in sorted(export_targets.items(), key=lambda x: get_bbox(x[1]['node'])[1]):
        node = info['node']
        name = node.get('name', '')
        nid = node.get('id', '')
        dim = info['dim']
        reasons = info['reasons'] | info['leaf_reasons']
        print(f'  {name}')
        print(f'  ID: {nid}  Size: {dim}')
        print(f'  Why: {", ".join(sorted(reasons))}')
        print()

    review_ids = [item['id'] for item in review_items]
    review_items = [item for item in review_items if not any(
        item['id'] != other_id and is_descendant_of_node(item['id'], other_id)
        for other_id in review_ids
    )]

    def print_mini_tree(node, depth=0, max_depth=4):
        if depth >= max_depth: return
        ntype = node.get('type', '?')
        name = node.get('name', '')
        _, _, w, h = get_bbox(node)
        fills = node.get('fills', [])
        fill_tags = []
        for f in fills:
            ft = f.get('type', '')
            if ft == 'IMAGE': fill_tags.append('IMAGE')
            elif 'GRADIENT' in ft: fill_tags.append('GRADIENT')
            elif ft == 'SOLID':
                c = f.get('color')
                if c: fill_tags.append(rgba_to_hex(c))
        radius = node.get('cornerRadius') or 0
        tag_parts = []
        if fill_tags: tag_parts.extend(fill_tags)
        if radius: tag_parts.append(f'r={radius}')
        tag_str = f' [{", ".join(tag_parts)}]' if tag_parts else ''
        indent = '    ' + '  ' * depth
        print(f'{indent}{ntype} "{name}" {int(w)}x{int(h)}{tag_str}')
        for c in node.get('children', []):
            print_mini_tree(c, depth + 1, max_depth)

    if review_items:
        print()
        print('NEEDS REVIEW')
        print('─' * 60)
        for item in review_items:
            print(f'  [{item["issue"]}]')
            print(f'  Node: {item["node"]} ({item["id"]})')
            print(f'  Action: {item["action"]}')
            node = all_nodes.get(item['id'])
            if node: print_mini_tree(node)
            print()

    print()
    print('TEXT ELEMENTS')
    print('─' * 60)

    for tid in sorted(text_entries, key=lambda x: get_bbox(all_nodes[x])[1]):
        node = all_nodes[tid]
        style = node.get('style', {})
        chars = node.get('characters', '')
        color = get_fill_color(node) or '?'
        font = style.get('fontFamily', '?')
        size = style.get('fontSize', '?')
        weight = style.get('fontWeight', 400)
        align = style.get('textAlignHorizontal', 'LEFT')
        lh = style.get('lineHeightPx', '?')
        _, _, w, h = get_bbox(node)
        preview = chars[:100].replace('\n', ' ')
        print(f'  "{preview}"')
        print(f'  ID: {node.get("id")}  Size: {int(w)}x{int(h)}')
        print(f'  Font: {font} {size}px  Weight: {weight}  Color: {color}  Align: {align}  LH: {lh}px')
        print()

for nid in (node_ids if node_ids else data.get('nodes', {}).keys()):
    node_data = data.get('nodes', {}).get(nid)
    if not node_data:
        continue
    doc = node_data.get('document')
    if not doc:
        continue
    # Reset global state per node
    all_nodes.clear()
    parent_map.clear()
    print('=' * 60)
    print(f'  {doc.get("name")} ({doc.get("id")})')
    print(f'  {int(get_bbox(doc)[2])}x{int(get_bbox(doc)[3])}')
    print('=' * 60)
    analyze(doc)
PYANALYZE
    ;;
esac
