# Task Lifecycle

This fork treats Linear workflow state as part of the agent contract.

## Default Flow

```text
Backlog + assigned/delegated to agent -> intake only -> Todo or Research
Todo -> first pickup -> Research
Research -> investigate and plan -> Research Review
Research Review -> wait for manager input
In Progress -> implementation
Final Review -> wait for review
Done -> no work
```

## Lifecycle Modes

`intake`

Clarify the issue, improve the title/description/acceptance criteria, add repository context, move to `Todo` or `Research`, and stop.

`research`

Investigate constraints, inspect relevant code, produce a plan, move to `Research Review`, and wait.

`implementation`

Make code changes only when the issue is in `In Progress` or the user explicitly overrides the workflow.

`review_wait`

Respond to comments if needed, but do not keep implementing while the issue is in `Research Review` or `Final Review`.

`ignore`

Do nothing for completed/canceled states.

## What The Plugin Does

The webhook handler fetches issue details, resolves the Linear state, classifies the lifecycle mode, and injects that mode into the agent prompt.

It can also call `issue/move-to-state` through the agent API so the agent can move an issue by workflow-state name instead of hardcoding Linear state IDs.

## What AGENTS.md Still Does

The plugin's runtime block is not enough by itself. Add `templates/AGENTS.linear-task-lifecycle.md` to the relevant `AGENTS.md` so the same policy applies to manual task runs, repo-local work, and future servers.

## Explicit Override Examples

Research request:

```text
@agent Please research this issue. Include downstream usage analysis and move it to Research Review when the plan is ready.
```

Implementation request:

```text
@agent This is approved for implementation. Move it to In Progress and implement the scoped fix.
```

