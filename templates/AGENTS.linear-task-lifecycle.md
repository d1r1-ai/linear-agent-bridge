# Linear Task Lifecycle

These rules apply when a task arrives from Linear or when work is tracked in Linear.

- Treat `Backlog` as intake-only when the task is assigned or delegated to the agent. Inspect only enough context to clarify scope, improve the title/description/acceptance criteria/repository context, move the issue to `Todo` or `Research`, post a short intake summary, and stop.
- `Todo` means assigned but not yet researched. On first pickup, move to `Research` if the integration supports it.
- Use `Research` for investigation, constraint gathering, and planning. When research is complete, move to `Research Review` and wait for human input.
- Do not begin implementation while the task is in `Backlog`, `Todo`, `Research`, `Research Review`, or `Final Review` unless the user explicitly overrides the workflow.
- Treat `In Progress` as the implementation state.
- When implementation is complete, move or ask to move the task to `Final Review`.
- Treat `Done` as completed and reviewed.
- Before editing, check local worktree status for the repository you will touch. Do not reset, overwrite, rebase, or delete unrelated local work without explicit permission.
- Keep changes focused on the Linear task.
- Prefer root-cause fixes over superficial workarounds.
- Run the smallest meaningful verification first, then expand when the change has broader risk.
- Final reports should include what changed, files or areas touched, checks run, skipped checks with reasons, PR link if any, and CI status when relevant.
- If blocked, state the exact missing input, credential, environment issue, failing check, or permission problem.

