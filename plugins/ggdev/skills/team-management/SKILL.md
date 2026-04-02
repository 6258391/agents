---
name: team-management
description: "TeamCreate, TaskCreate, Spawn, Assign, Collect, Distribute, Fix, Verify, Cleanup, Bootstrap. Invoke per phase with action prompt."
user-invocable: false
allowed-tools: Read, Write
---

Coordinate team lifecycle — create teams, create tasks, spawn agents, assign tasks, collect and distribute data, fix and verify outputs, cleanup teams, bootstrap roles. Each invocation executes exactly one phase determined by the action prompt.

1. **TeamCreate**
   - Input: team name from invoke prompt
   - Output: team context established
   - DO: verify `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set. If not, tell user how to set it.
   - DO: TeamCreate to establish team context before any other team operations
   - DON'T: create tasks or spawn agents before TeamCreate. Instead, always TeamCreate first.
   - WHY DON'T: tasks created before TeamCreate are not linked to team context. Agents find empty TaskList.

   ```
   TeamCreate: team_name "{team-name}"
   ```

2. **TaskCreate**
   - Input: list of modules with file paths
   - Output: tasks created and linked to team
   - DO: TaskCreate for each module (tasks auto-link to team)
   - DO: use subject format `{action}-{target}` for task routing
   - DO: put only file paths in task description
   - DON'T: put visual descriptions, structural context, or implementation hints in task descriptions. Instead, file paths only.
   - WHY DON'T: agents reading visual context skip their own analysis and bypass skill invocation entirely.

   ```
   TaskCreate: subject "{action}-{target}", description: file paths only
   ```

3. **Spawn**
   - Input: role type and team name from invoke prompt
   - Output: members running with role definitions loaded
   - DO: determine team size from task count: 1-2 tasks = 1 agent, 3-5 = 2, 6+ = 3
   - DO: Agent tool with subagent_type "general-purpose", team_name + name to spawn members
   - DO: use exact spawn prompt: "Use Skill tool: skill='ggdev:team-management', args='Bootstrap as {role}'. Then check TaskList."
   - DON'T: write custom spawn prompts or pass role content inline. Instead, let members bootstrap via skill invoke.
   - WHY DON'T: custom prompts consume Lead tokens and miss identity/scope/constraints that role definitions provide.
   - DON'T: use any subagent_type other than "general-purpose". Instead, always set subagent_type to "general-purpose".
   - WHY DON'T: other subagent_type values load agent definitions (e.g., "frontend" loads the Lead agent). Team members get their role via Bootstrap skill invocation, not via subagent_type.

   ```
   Agent: subagent_type "general-purpose", team_name "{team-name}", name "{role}-{i}", prompt "Use Skill tool: skill='ggdev:team-management', args='Bootstrap as {role}'. Then check TaskList."
   ```

4. **Assign**
   - Input: task IDs and member names
   - Output: tasks assigned to members
   - DO: TaskUpdate with owner to assign tasks to members
   - DO: distribute tasks round-robin across members
   - DON'T: assign all tasks to one member when multiple members exist. Instead, distribute round-robin.
   - WHY DON'T: unbalanced assignment wastes spawned agents and creates bottlenecks.

   ```
   TaskUpdate: taskId "{id}", owner "{member-name}"
   ```

5. **Collect**
   - Input: question file paths from member messages
   - Output: deduplicated questions written to file path specified in invoke prompt
   - DO: read question files from paths sent by members
   - DO: deduplicate similar questions across modules
   - DO: group questions by category
   - DO: write deduplicated questions to the output file specified in invoke prompt
   - DON'T: add your own questions or filter member questions. Instead, present exactly what members asked.
   - WHY DON'T: members know what values they need from their loaded skill. Adding or filtering corrupts their process.

6. **Distribute**
   - Input: answer file paths written by Lead
   - Output: notification sent to each member by name
   - DO: SendMessage to each member individually by name with their answer file path
   - DON'T: send answer content in messages. Instead, send only the file path as notification.
   - WHY DON'T: large data burns context window for both sender and receiver. Members read files directly.

7. **Fix**
   - Input: verification report file path
   - Output: fix task created for original member
   - DO: write verification issues to a report file if not already written
   - DO: TaskCreate fix task with report file path only in description
   - DO: TaskUpdate owner to original member
   - DO: re-verify after fix
   - DO: max 3 loops, then escalate to human
   - DON'T: put specific issues inline in task description. Instead, write issues to report file and reference the path.
   - WHY DON'T: inline data burns context window for both Lead and member. Members read files directly.
   - DON'T: assign fix task to a different member. Instead, always assign to the original member who built it.
   - WHY DON'T: different member doesn't know the decisions made during original build. Fix attempts will conflict.

   ```
   TaskCreate: subject "fix-{target}-{N}", description: "{report-file-path}"
   TaskUpdate: taskId "{id}", owner "{original-member-name}"
   ```

8. **Verify**
   - Input: completed member outputs
   - Output: verification report written to file
   - DO: confirm output files exist and follow expected format
   - DO: write verification results to the report file path specified in the action prompt
   - DO: if issues found, invoke fix phase before cleanup
   - DON'T: keep verification results in context only. Instead, write to the report file so fix phase can reference it.
   - WHY DON'T: in-context results are data in messages. Members must read files directly per team-protocol rule 5.
   - DON'T: modify member-written output files. Instead, create fix tasks if issues found.
   - WHY DON'T: modifying outputs introduces values not confirmed through the proper process.

9. **Cleanup**
   - Input: all tasks completed and verified
   - Output: team disbanded
   - DO: SendMessage shutdown_request to each member individually
   - DO: TeamDelete after all members shut down
   - DON'T: TeamDelete before all members shut down. Instead, wait for shutdown confirmations.
   - WHY DON'T: TeamDelete fails if team still has active members.

   ```
   SendMessage: to "{member-name}", message {type: "shutdown_request"}
   TeamDelete (after all members confirmed shutdown)
   ```

10. **Bootstrap**
   - Input: role name from invoke prompt
   - Output: role definition loaded into member context
   - DO: read `${CLAUDE_SKILL_DIR}/references/{role}.md`
   - DO: follow the role definition after reading
   - DON'T: skip reading the role file. Instead, always read before starting any work.
   - WHY DON'T: without role definition, member has no identity, scope, workflow, or constraints. All work will be unstructured.
