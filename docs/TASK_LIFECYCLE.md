# Task Lifecycle

This fork treats Linear workflow state as part of the agent contract.

## Default Flow

```text
Backlog + assigned/delegated to agent -> intake only -> Todo + unassign
Todo -> manager-owned queue
Research -> investigate and plan -> Research Review
Research Review -> wait for manager input or approval
In Progress -> implementation
Final Review -> wait for review
Done -> no work
```

## Lifecycle Modes

`intake`

Clarify the issue, improve the title/description/acceptance criteria, add repository context, add missing labels and estimate, move to `Todo`, unassign the agent, and stop.

`todo_wait`

Leave the issue in `Todo`. `Todo` is manager-owned. Do not automatically take, self-assign, or move it to `Research` unless the manager explicitly asks.

`research`

Take the issue only if it has already been moved to `Research`. Assign the issue to the agent if needed, investigate constraints, inspect relevant code, produce a plan with risks and open questions, move to `Research Review`, and wait.

`implementation`

Make code changes only when the issue is in `In Progress` or the manager explicitly overrides the workflow. Follow the approved Linear research plan and comments.

`review_wait`

Respond to comments if needed, but do not keep implementing while the issue is in `Research Review` or `Final Review`.

`ignore`

Do nothing for completed/canceled states.

## What The Plugin Does

The webhook handler fetches issue details, resolves the Linear state, classifies the lifecycle mode, and injects that mode into the agent prompt.

It can also call `issue/move-to-state` through the agent API so the agent can move an issue by workflow-state name instead of hardcoding Linear state IDs.

Strict addressing stays enabled. New assignment or delegation can start the relevant lifecycle handling, and replies inside an existing agent session can omit the agent handle only when the issue is actually assigned or delegated to that agent.

## What AGENTS.md Still Does

The plugin's runtime block is not enough by itself. Add `templates/AGENTS.linear-task-lifecycle.md` to the relevant `AGENTS.md` so the same policy applies to manual task runs, repo-local work, and future servers.

## Explicit Override Examples

Research request:

```text
@agent Please move this issue to Research and prepare the research plan. Include downstream usage analysis and move it to Research Review when the plan is ready.
```

Implementation request:

```text
@agent This is approved for implementation. Move it to In Progress and implement the scoped fix.
```
