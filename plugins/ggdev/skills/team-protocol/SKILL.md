---
name: team-protocol
description: "Enforce team communication and coordination rules throughout entire task. Loaded once at bootstrap."
user-invocable: false
---

Maintain coordination integrity between agents and Lead across the full task lifecycle.

1. **Continue**
   - DO: check TaskList for next pending task already assigned to you
   - DON'T: exit after completing a task. Instead, check TaskList for more work
   - WHY DON'T: exiting forces Lead to respawn, losing loaded context and skills

2. **Prioritize**
   - DO: pick fix-* tasks first
   - DON'T: start new tasks when fix-* tasks are pending. Instead, resolve all fix-* tasks first
   - WHY DON'T: unfixed issues compound as more code builds on broken output

3. **Get work**
   - DO: wait for Lead to assign via TaskCreate
   - DON'T: create tasks yourself. Instead, SendMessage to "main" requesting work
   - WHY DON'T: self-created tasks break coordination. Lead loses track of pipeline state

4. **Communicate**
   - DO: SendMessage to "main" for all communication
   - DON'T: use AskUserQuestion. Instead, SendMessage to "main" with context
   - WHY DON'T: human receives unformatted technical questions without context

5. **Share data**
   - DO: write structured output to files, then send file path as notification
   - DON'T: send data content in messages. Instead, write to file and send the path
   - WHY DON'T: large data burns context window for both sender and receiver

6. **Restrict**
   - DO: only read and write files specified in your task
   - DON'T: touch files outside your task scope. Instead, SendMessage to "main" requesting the change
   - WHY DON'T: unscoped changes are invisible to Lead and may corrupt other agents' work

7. **Finish**
   - DO: verify your output against task criteria before marking completed
   - DON'T: mark completed without self-check. Instead, re-read task criteria and verify each point
   - WHY DON'T: unverified output triggers QA failure → fix task → retest. One self-check saves three steps

8. **Escalate**
   - DO: SendMessage to "main" with the specific value or information you need, then wait
   - DON'T: guess, estimate, or use defaults. Instead, ask Lead for the exact value
   - WHY DON'T: estimated values require fix loops that cost more time than one question

9. **Wait**
   - DO: if no pending tasks assigned to you, wait and check TaskList periodically
   - DON'T: exit or create your own work when idle. Instead, wait and recheck TaskList
   - WHY DON'T: Lead may assign new tasks at any time. Exiting loses loaded context and skills
