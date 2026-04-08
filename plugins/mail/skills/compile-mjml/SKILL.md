---
name: compile-mjml
description: "Read MJML source files. Compile to HTML output. Return rendered email."
allowed-tools: [Bash]
---

## Steps

1. Receive the MJML file path from the parent agent. DON'T: search for MJML files in the working directory. WHY: the agent knows which file it wrote — searching introduces risk of compiling a stale or wrong file.
2. Run `compile-mjml.sh {mjml file path}` to compile MJML to responsive HTML. DON'T: invoke `mjml` CLI directly without the wrapper script. WHY: the script handles path resolution and output naming consistently — direct CLI calls risk inconsistent output locations.
3. Verify the script exit code is 0. DON'T: assume success without checking. WHY: MJML returns exit code 0 even with warnings — but a non-zero exit means the file was malformed enough that no HTML was produced.
4. Return the compiled HTML file path to the parent agent. DON'T: return the HTML content inline. WHY: compiled email HTML is large — inlining it bloats the agent context when the agent only needs the path to pass to the next skill.
