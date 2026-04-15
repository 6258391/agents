# testcases

Fixture-based regression and correctness tests for `validate-html-email`.

## Layout

```
testcases/
├── test.sh                    # runner
├── fixtures/
│   ├── <name>/
│   │   ├── input.html         # HTML under test
│   │   ├── profile            # single line: default or honda
│   │   ├── params             # optional: key=value per line (underscore keys)
│   │   └── expected.txt       # recorded runner stdout with file path normalized
│   └── ...
```

## Commands

Fixture regression run:

```bash
./test.sh
```

Record or refresh `expected.txt` after a legitimate behavior change:

```bash
./test.sh record
```

Unit tests on vendor-neutral rules (node:test):

```bash
./unit.sh
```

Every `rules/*.test.js` (not `rules/honda/`) runs under the Node built-in test runner. Honda wrappers are not unit tested because they delegate to the verbatim Honda source; fixture tests cover them.

## Fixture tiers

| Tier | Fixtures | Purpose |
|------|----------|---------|
| P1 smoke | `default-clean`, `default-dirty`, `honda-no-params` | Regression guard against script or runner changes |
| P0 correctness | `honda-correctness-*` | Empirical 1:1 parity with Honda browser tool on real production HTML |

P0 fixtures require human to supply the expected output from the Honda browser tool. See `fixtures/honda-correctness-01/README.md`.

## Params file format

```
campaign_code=A03730-T03730
cid=T03730
preview_text=Your adventure starts
title_text=Welcome
```

Runner converts underscore keys to `--kebab-case` flags before invoking the skill script.

## Expected output normalization

The `file:` line contains an absolute path that varies per machine. The runner rewrites it to `file:    {FIXTURE}` before comparison. No other normalization applies.
