---
name: validate-plugin
description: "Validate plugin files. Enforce structural compliance. Report all violations."
allowed-tools: ["Agent", "Bash", "Glob"]
---

## Steps

1. Run `validate-plugin.sh` with the plugin directory path using `Bash tool`. DON'T: skip this step or check folder structure manually. WHY: the script validates directory layout against the official plugin spec — manual checks miss structural violations the script catches consistently.
2. Report FAIL with the script output if `validate-plugin.sh` exits non-zero. DON'T: continue to file discovery when folder structure is broken. WHY: broken structure means files are in wrong locations — per-file validation would run against files the runtime will never load.
3. Discover all target files using `Glob tool` with patterns `**/*.md`, `**/*.sh`, and `**/plugin.json` scoped to the plugin directory. DON'T: pass the directory path to linter or grader and let them discover files. WHY: linter and grader spawned as sub-agents cannot spawn their own sub-agents — fan-out must happen here.
4. Spawn one `Agent tool with subagent_type: "craft:linter"` per discovered file with prompt `"Lint file: {absolute_file_path}"`. DON'T: spawn a single linter for the whole directory. WHY: a single linter sub-agent hits the fan-out bug — it tries to spawn per-file children but sub-agents cannot spawn sub-agents.
5. Spawn one `Agent tool with subagent_type: "craft:grader"` per discovered `.md` file with prompt `"Grade file: {absolute_file_path}"` after all linters complete. DON'T: run graders before linters finish or grade non-`.md` files. WHY: linters fix structural violations first — grading unfixed content produces unreliable scores. Scripts and manifests have no rules or sub-steps to grade.
6. State the overall result as PASS only when all checks pass — script, every linter, and every grader. DON'T: summarize or reformat agent output — relay their tables directly. WHY: reformatting risks dropping individual file results — agent output tables are already the canonical format.
