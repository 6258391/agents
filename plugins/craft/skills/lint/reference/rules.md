# Lint rules

## Shared rules

### General

**R1.1** DON'T repeat the same info across blocks. Instead keep each fact in exactly one block. WHY duplication drifts when one copy changes.

**R1.2** DON'T mix languages in the prompt body. Instead write in one language only. WHY mixed languages confuse which language to reply in.

**R1.3** DON'T use any of these listed vague or flattery words. Instead bash `forbid_words 'quite|somewhat|fairly|moderately|smart|creative|excellent|intelligent|brilliant|amazing|great|powerful|genius|innovative' "$BODY_CLEAN"`. WHY the curated list captures common vague degree words and marketing flattery.

**R1.4** DON'T write prose for human readers such as rhetorical questions, exclamations, or metaphors. Instead write precise instructions for AI to parse. WHY AI processes literally and prose creates ambiguity.

**R1.5** DON'T use any of these listed hedging words. Instead bash `forbid_words 'try to|should|preferably|usually|might|sometimes|in some cases|possibly|perhaps|probably|likely|typically|often' "$BODY_CLEAN"`. WHY listed hedges give AI room to skip the rule.

**R1.6** DON'T use any of these listed passive verbs that hide the actor. Instead bash `forbid_words 'helps|allows|enables|supports|provides|facilitates|assists|offers|empowers' "$BODY_CLEAN"`. WHY listed verbs obscure who does what.

### Frontmatter

**R2.1** DON'T accept missing or malformed frontmatter. Instead bash `[[ -n "$FRONTMATTER" && -n "$NAME" && -n "$DESCRIPTION" ]]`. WHY missing frontmatter blocks file type detection.

**R2.2** DON'T name freely. Instead bash `[[ "$NAME" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ && "$NAME" == "$EXPECTED_NAME" ]]`. WHY name is identity and inconsistent naming breaks discovery.

**R2.3** DON'T write a description outside 3 sentences with 5 words each. Instead bash `check_description_formula`. WHY fixed shape keeps descriptions scannable.

**R2.4** DON'T use commas or non ASCII characters or any of these listed passive verbs in description. Instead bash `[[ ! "$DESCRIPTION" =~ , ]] && ! grep -qiwE 'helps|allows|enables|supports|provides' <<< "$DESCRIPTION" && ! LC_ALL=C grep -q $'[^\x01-\x7f]' <<< "$DESCRIPTION"`. WHY commas and non ASCII chars break parsing and the listed verbs obscure the actor.

**R2.5** DON'T start a description sentence with a noun. Instead start with an imperative verb. WHY noun-led descriptions describe things not actions.

## Agent rules

### Structure

**RA1.1** DON'T reorder, rename, or remove agent blocks. Instead bash `check_agent_block_order`. WHY fixed structure lets linter detect blocks by pattern matching.

### Frontmatter

**RA2.1** DON'T name an agent without the actor suffix. Instead bash `[[ "$NAME" =~ er$ ]]`. WHY the -er suffix signals an actor role.

**RA2.2** DON'T change or restrict the tools value. Instead bash `[[ "$TOOLS" == '["*"]' ]]`. WHY all agents get full tool access by convention.

**RA2.3** DON'T list skills without a matching Skill Definitions entry. Instead bash `check_skills_match_definitions`. WHY mismatched skills create dead code or missing handlers.

### Role

**RA3.1** DON'T start Role without identifying the AI. Instead bash `head -1 <<< "$ROLE" | grep -qE '^You are .+ of .+\.$'`. WHY Role block exists to answer who this AI is.

**RA3.2** DON'T leave Role without declaring tone as formal or neutral or casual. Instead bash `grep -qiwE 'formal|neutral|casual' <<< "$ROLE"`. WHY explicit tone keeps responses consistent across calls.

**RA3.3** DON'T put behavior, limits, or capabilities in Role. Instead only describe identity and tone. WHY Role answers who, not what or how.

**RA3.4** DON'T write more than 5 sentences in Role. Instead bash `[[ $(tr '.!?' '\n' <<< "$ROLE" | grep -cE '[[:alnum:]]') -le 5 ]]`. WHY a long Role steals scope from Rules or Skills.

**RA3.5** DON'T narrow the role name with implementation details. Instead keep the role at the broadest accurate abstraction. WHY a narrow role name couples identity to a feature.

### Rules & Constraints

**RA4.1** DON'T write rules as free text or combine multiple rules in one line. Instead bash `check_rule_format`. WHY consistent format makes each rule a lint rule definition.

**RA4.2** DON'T write rules without a numbered prefix. Instead bash `check_rule_numbering`. WHY numbered prefixes let other rules reference a specific rule unambiguously.

**RA4.3** DON'T use periods, dashes, or semicolons inside rule clauses except within backtick code spans. Instead bash `check_rule_punctuation`. WHY extra punctuation breaks the `DON'T/Instead/WHY` parser that splits on period then space.

**RA4.4** DON'T tag a rule `bash` without a real executable command in backticks. Instead use `bash` only for runnable checks and write plain prose for everything else. WHY plain prose falls through to AI review and fake bash tags bypass real verification.

**RA4.5** DON'T have rules that contradict each other. Instead review all rules for conflicts before finalizing. WHY contradicting rules make AI pick randomly.

**RA4.6** DON'T mix global rules with output rules or add explanations inline. Instead put global rules here and output rules in Output Format. WHY misplaced rules confuse scope.

**RA4.7** DON'T exceed 10 rules per subsection. Instead bash `check_rules_per_subsection`. WHY too many rules signal a design problem.

### Skill Definitions

**RA5.1** DON'T write skills as free text or with vague triggers like "when needed". Instead bash `[[ -z "$SKILL_DEFS_BLOCK" ]] || { ! grep -E '^\*\*[a-z:-]+\*\*' <<< "$SKILL_DEFS_BLOCK" | grep -vqE 'WHEN .+ THEN .+' && ! grep -qiE 'WHEN (needed|necessary|appropriate|required)' <<< "$SKILL_DEFS_BLOCK"; }`. WHY strict format makes skills routable and vague triggers break routing.

**RA5.2** DON'T describe how a skill works internally. Instead only describe when to call it and what it outputs. WHY internals are implementation details.

**RA5.3** DON'T define skills with overlapping responsibilities. Instead each skill has exactly one job. WHY overlapping skills create ambiguous routing.

**RA5.4** DON'T list more than 5 skills. Instead bash `[[ $(grep -cE '^\*\*[a-z:-]+\*\*' <<< "$SKILL_DEFS_BLOCK") -le 5 ]]`. WHY too many skills signal the agent is doing too much.

**RA5.5** DON'T list skills in random order. Instead order from most common to least common. WHY random order slows lookup.

**RA5.6** DON'T reference a skill without a plugin name prefix. Instead use the format `plugin:skill-name` in both `skills[]` and Skill Definitions. WHY an unprefixed skill name fails to route to the correct plugin at runtime.

**RA5.7** DON'T spawn sub-agents directly from an agent file. Instead delegate spawning to a skill with `allowed-tools: [Agent]`. WHY direct spawning in agent files bypasses skill routing and breaks the delegation model.

### Output Format

**RA6.1** DON'T write processing instructions in Output Format. Instead encode constraints inline within the template. WHY imperative instructions are logic and inline constraints are shape.

**RA6.2** DON'T write one generic format for all input types or put examples in other blocks. Instead list each format case separately with worked examples. WHY generic formats miss edge cases and scattered examples confuse block ownership.

## Skill rules

### Structure

**RS1.1** DON'T reorder, rename, or remove skill blocks. Instead bash `check_skill_block_order`. WHY fixed structure lets linter detect blocks by pattern matching.

**RS1.2** DON'T add blocks beyond the 5 allowed. Instead bash `check_skill_allowed_blocks`. WHY extra blocks break the fixed structure.

**RS1.3** DON'T document multiple tools in one file or use H1 headings except for the tool name. Instead bash `[[ $(grep -cE '^# ' <<< "$BODY_CLEAN") -le 1 ]]`. WHY merged docs make params and examples ambiguous.

### Frontmatter

**RS2.1** DON'T set allowed-tools to ["*"] or leave it empty. Instead bash `[[ -n "$ALLOWED_TOOLS" && "$ALLOWED_TOOLS" != '["*"]' && "$ALLOWED_TOOLS" != '[]' ]]`. WHY ["*"] is reserved for agents and empty means the skill cannot call any tool.

### One-liner

**RS3.1** DON'T accept a one-liner with more than 1 sentence, with semicolons, or with commas. Instead bash `[[ $(grep -oE '[.!?]' <<< "$ONE_LINER" | wc -l) -le 1 ]] && ! grep -q ';' <<< "$ONE_LINER" && ! grep -q ',' <<< "$ONE_LINER"`. WHY commas enable comma splices and semicolons prove the tool does 2 things.

**RS3.2** DON'T accept a freeform one-liner. Instead bash `[[ "$ONE_LINER" =~ ^${NAME}\ —\ [a-z]+\ .+\ into\ .+ ]]`. WHY a fixed format makes every skill doc read the same way.

**RS3.3** DON'T use any of these listed filler words in the one-liner. Instead bash `forbid_words 'easily|powerful|efficient|quickly|convenient|seamlessly|effortlessly|simply|intuitive|modern|lightweight|comprehensive' "$ONE_LINER"`. WHY listed marketing filler carries zero information.

**RS3.4** DON'T list features in the one-liner. Instead describe only the single core function. WHY the one-liner has 1 sentence and stuffing features turns it into a feature list.

### Flow

**RS4.1** DON'T accept fewer than 3 or more than 5 flow steps. Instead bash `n=$(grep -cE '^[0-9]+\. ' <<< "$FLOW_BLOCK"); [[ $n -ge 3 && $n -le 5 ]]`. WHY fewer than 3 is too vague and more than 5 means the tool does too much.

**RS4.2** DON'T accept a flow step starting with a noun. Instead every step starts with an infinitive verb. WHY noun-led steps describe things not actions.

**RS4.3** DON'T accept a flow step longer than 8 words excluding backtick code spans. Instead bash `check_flow_step_length`. WHY steps beyond 8 words smuggle explanation into the flow.

**RS4.4** DON'T start a flow step with any of these listed setup verbs Install Configure Import Setup or Set up. Instead bash `! grep -qiE '^[[:space:]]*[0-9]+\. (Install|Configure|Import|Setup|Set up)' <<< "$FLOW_BLOCK"`. WHY flow describes the runtime workflow not setup prerequisites.

**RS4.5** DON'T include explanations or reasoning in flow steps. Instead list actions only. WHY flow lists actions in execution order.

**RS4.6** DON'T end the flow with any of these listed vague verbs finalize complete finish done or wrap up. Instead bash `forbid_words 'finalize|complete|finish|done|wrap up' "$(grep -E '^[0-9]+\. ' <<< "$FLOW_BLOCK" | tail -1)"`. WHY listed verbs hide what the skill actually produces.

**RS4.7** DON'T format flow steps as a bulleted list. Instead bash `! grep -qE '^- ' <<< "$FLOW_BLOCK"`. WHY hyphen format implies unordered items while flow steps run in order.

### Params

**RS5.1** DON'T accept more than 7 params. Instead group into nested objects or split the skill. WHY 8+ params signal the skill does too many things.

**RS5.2** DON'T place optional params before required ones. Instead list required first, optional after. WHY reversed order makes the reader guess which are mandatory.

**RS5.3** DON'T accept a param missing any of 4 fields. Instead require name, required, default, and description for every param. WHY a missing field forces the reader to check source code.

**RS5.4** DON'T accept a param description longer than 10 words or starting with filler prefixes like "Used to", "Allows", or "Helps". Instead write a direct phrase under 10 words. WHY filler prefixes waste the word budget.

**RS5.5** DON'T leave an optional param default empty or N/A. Instead specify the actual default. WHY an unknown default means the reader cannot predict behavior.

**RS5.6** DON'T explain why a param exists. Instead state only what it does. WHY param descriptions are reference lookups.

**RS5.7** DON'T invent param names. Instead use the tool actual format. WHY a renamed param will not match --help output.

### Examples

**RS6.1** DON'T accept fewer than 2 or more than 3 examples. Instead bash `n=$(grep -cE '^### ' <<< "$EXAMPLES_BLOCK"); [[ $n -ge 2 && $n -le 3 ]]`. WHY 1 example shows only the happy path and 4+ bloat the doc.

**RS6.2** DON'T repeat the same param set across examples. Instead each example covers at least 1 param not in the previous one. WHY duplicated param coverage wastes an example slot.

**RS6.3** DON'T label examples basic and advanced for the same use case. Instead use 2 genuinely different use cases. WHY basic/advanced shows complexity not breadth.

**RS6.4** DON'T use placeholders in example commands. Instead bash `! grep -qE '<[A-Za-z][A-Za-z0-9_-]*>' <<< "$EXAMPLES_BLOCK"`. WHY placeholders force the reader to substitute before running.

**RS6.5** DON'T add output explanation lines below the command. Instead let the example speak for itself. WHY explanation after the command is noise.

**RS6.6** DON'T name a use case with more than 5 words or as a noun phrase. Instead write an action phrase under 5 words. WHY noun titles describe a category.

### Gotchas

**RS7.1** DON'T accept more than 13 gotchas. Instead bash `[[ -z "$GOTCHAS_BLOCK" ]] || [[ $(grep -cE '^- ' <<< "$GOTCHAS_BLOCK") -le 13 ]]`. WHY 14+ gotchas mean the tool has design problems.

**RS7.2** DON'T include theoretical gotchas. Instead only list errors users have actually hit. WHY theoretical warnings train readers to ignore the section.

**RS7.3** DON'T use the words should or best practice in gotchas. Instead bash `[[ -z "$GOTCHAS_BLOCK" ]] || forbid_words 'should|best practice' "$GOTCHAS_BLOCK"`. WHY these words give advice instead of concrete actions.

**RS7.4** DON'T leave Gotchas empty or containing any of these listed markers tbd n/a none todo or placeholder. Instead bash `[[ -z "$GOTCHAS_BLOCK" ]] || { [[ -n "$(tr -d '[:space:]' <<< "$GOTCHAS_BLOCK")" ]] && ! grep -qiwE 'tbd|n/a|none|todo|placeholder' <<< "$GOTCHAS_BLOCK"; }`. WHY listed markers signal incomplete thinking.

**RS7.5** DON'T repeat info already in Params or Examples. Instead add only new information. WHY duplicated info drifts over time.

**RS7.6** DON'T format gotchas as a numbered list. Instead bash `[[ -z "$GOTCHAS_BLOCK" ]] || ! grep -qE '^[0-9]+\. ' <<< "$GOTCHAS_BLOCK"`. WHY numbered format implies ordered steps while gotchas are independent warnings.

**RS7.7** DON'T accept gotchas scoring below 10. Instead bash `[[ -z "$GOTCHAS_BLOCK" ]] || check_gotchas_score`. WHY each criterion targets a distinct quality failure that makes a gotcha unactionable.

## Shell script rules

### Structure

**RSH1.1** DON'T organize a sh file longer than 20 lines without `# bootstrap` and `# dispatch` section markers; `# helpers` is required only when the file defines functions. Instead bash `[ $(wc -l < "$FILE") -le 20 ] || awk '/^# bootstrap$/{b=NR} /^# helpers$/{h=NR} /^# dispatch$/{d=NR} /^_[a-z_]+\(\)/{fn=1} END{if(!b||!d||b>=d)exit 1; if(fn&&(!h||h<b||h>d))exit 1}' "$FILE"`. WHY bootstrap and dispatch are always present in sh files longer than 20 lines; helpers marker is only meaningful when the file defines private functions.
