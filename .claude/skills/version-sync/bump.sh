#!/usr/bin/env bash
# version-sync: bump the top-level "version" field in all Prodigy Origin
# package.json files, the version: in CITATION.cff, AND the VERSION
# constant in P-NP/src/constants.ts.
set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "usage: bump.sh <target-version>" >&2
  exit 1
fi

if ! [[ "$TARGET" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.]+)?$ ]]; then
  echo "error: '$TARGET' is not a valid semver" >&2
  exit 2
fi

PKG_FILES=(
  "/home/alex/ProdigyMathGameHacking/extension/package.json"
  "/home/alex/ProdigyMathGameHacking/originGUI/package.json"
  "/home/alex/ProdigyMathGameHacking/typings/package.json"
  "/home/alex/P-NP/package.json"
)

CITATION_FILE="/home/alex/ProdigyMathGameHacking/CITATION.cff"
CONSTS_FILE="/home/alex/P-NP/src/constants.ts"

for f in "${PKG_FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "error: missing $f" >&2
    exit 3
  fi
  old=$(python3 -c "
import json
with open('$f') as fh:
    print(json.load(fh).get('version', '?'))
")
  python3 -c "
import json
path = '$f'
with open(path) as fh:
    data = json.load(fh)
data['version'] = '$TARGET'
with open(path, 'w') as fh:
    json.dump(data, fh, indent=2)
    fh.write('\n')
"
  echo "  $f: $old → $TARGET"
done

if [[ ! -f "$CITATION_FILE" ]]; then
  echo "error: missing $CITATION_FILE" >&2
  exit 4
fi

old_cff=$(grep -oE '^version: .+' "$CITATION_FILE" | sed -E 's/^version: (.+)$/\1/')
python3 -c "
import re
with open('$CITATION_FILE') as fh:
    content = fh.read()
content = re.sub(
    r'^version: .+$',
    'version: $TARGET',
    content,
    count=1,
    flags=re.MULTILINE
)
with open('$CITATION_FILE', 'w') as fh:
    fh.write(content)
"
echo "  $CITATION_FILE: $old_cff → $TARGET"

if [[ ! -f "$CONSTS_FILE" ]]; then
  echo "error: missing $CONSTS_FILE" >&2
  exit 5
fi

old_const=$(grep -oE 'export const VERSION = "[^"]+"' "$CONSTS_FILE" | sed -E 's/.*"([^"]+)".*/\1/')
python3 -c "
import re
with open('$CONSTS_FILE') as fh:
    content = fh.read()
content = re.sub(
    r'export const VERSION = \"[^\"]+\"',
    'export const VERSION = \"$TARGET\"',
    content
)
with open('$CONSTS_FILE', 'w') as fh:
    fh.write(content)
"
echo "  $CONSTS_FILE: $old_const → $TARGET"

echo ""
echo "✓ bumped ${#PKG_FILES[@]} package.json files + CITATION.cff + 1 VERSION constant to $TARGET"
echo "  next: review with 'git diff', then commit in each repo."
echo "  note: P-NP requires 'pnpm build && node dist/patch.js ./dist' to bake into game.min.js"
