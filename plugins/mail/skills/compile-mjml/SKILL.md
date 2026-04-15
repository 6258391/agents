---
name: compile-mjml
description: "Read MJML source files. Compile to HTML output. Return rendered email."
allowed-tools: [Bash]
---

compile-mjml — compile mjml into responsive html.

## Flow

1. Receive `MJML_FILE` from the caller.
2. Run `compile-mjml.sh MJML_FILE`.
3. Verify exit code is 0.
4. Return the HTML file path.

## Params

| name | required | default | description |
|------|----------|---------|-------------|
| MJML_FILE | yes | — | Path to MJML source file |
| OUTPUT_FILE | no | `${MJML_FILE%.mjml}.html` | Custom HTML output path |

## Examples

### Compile alongside MJML source

```bash
compile-mjml.sh ./templates/welcome.mjml
```

### Compile into build directory

```bash
compile-mjml.sh ./templates/welcome.mjml ./build/welcome-2026-04.html
```

## Gotchas

- Invoke `compile-mjml.sh` instead of the `mjml` CLI because the wrapper handles output naming consistently.
- Check the script exit code instead of trusting stdout because MJML returns 0 on warnings but non-zero means no HTML was produced.
- Return the HTML file path instead of inlining content because compiled email HTML bloats agent context.
- Read the JSON facts on stderr alongside the path on stdout because those facts let the caller verify compile correctness without re-reading the HTML.
- Treat exit 1 with stderr `npx mjml failed; no HTML produced` as a missing output file because MJML may exit 0 with warnings yet produce nothing.
