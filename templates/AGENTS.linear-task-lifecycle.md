# Linear Task Lifecycle

These rules apply when a task arrives from Linear or when work is tracked in Linear.

- Treat Linear as the source of truth for repository work. If code, docs, or spec work has no Linear issue, create one before implementation.
- Handle assigned issues by highest-progress state first: `In Progress` and `Final Review` follow-up, then `Research Review` with manager comments, then `Research`, then `Backlog`/`Todo`.
- Treat `Backlog` as intake-only when the task is assigned or delegated to the agent. Inspect only enough context to clarify scope, improve the title/description/acceptance criteria/repository context, add missing labels and estimate, move the issue to `Todo`, post a short intake summary, unassign yourself, and stop.
- Treat `Todo` as manager-owned. Do not automatically take, self-assign, or move `Todo` issues to `Research` unless the manager explicitly asks.
- Use `Research` as the first agent-owned execution state. Only take the task if it has already been moved to `Research`; assign it to yourself if needed, post a working plan, ask necessary questions, and keep yourself assigned.
- When research is complete, move to `Research Review` and wait for manager input. If manager comments arrive, update the plan. Do not implement until the manager moves the issue to `In Progress`.
- Do not begin implementation while the task is in `Backlog`, `Todo`, `Research`, `Research Review`, or `Final Review` unless the manager explicitly overrides the workflow.
- Treat `In Progress` as the implementation state.
- Implement only according to the approved Linear research plan and comments, and only in the repository or repositories identified in the issue or research plan.
- When implementation is complete, open a PR, check CI status, and move or ask to move the task to `Final Review`.
- Treat `Done` as completed and reviewed.
- Before editing, check local worktree status for the repository you will touch. Do not reset, overwrite, rebase, or delete unrelated local work without explicit permission.
- Keep changes focused on the Linear task.
- During intake, preserve existing labels and estimate unless there is a clear reason to change them. If labels or estimate are missing, add them before moving the issue out of `Backlog`.
- Keep branches, commits, and PR titles in Conventional Commit style.
- Prefer root-cause fixes over superficial workarounds.
- Run the smallest meaningful verification first, then expand when the change has broader risk.
- Final reports should include what changed, files or areas touched, checks run, skipped checks with reasons, PR link if any, and CI status when relevant.
- If blocked, state the exact missing input, credential, environment issue, failing check, or permission problem.
