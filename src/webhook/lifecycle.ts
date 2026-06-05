import type { OpenClawPluginApi, PluginConfig } from "../types.js";
import { callLinear, resolveViewer } from "../linear-client.js";
import { ISSUE_DETAIL_QUERY } from "../graphql/queries.js";
import { readArray, readObject, readString } from "../util.js";

export type LifecycleMode =
  | "intake"
  | "todo_wait"
  | "research"
  | "implementation"
  | "review_wait"
  | "reply_only"
  | "ignore";

export interface LifecycleIssueContext {
  id: string;
  identifier: string;
  title: string;
  description: string;
  url: string;
  stateId: string;
  stateName: string;
  stateType: string;
  teamId: string;
  teamKey: string;
  teamName: string;
  projectId: string;
  projectName: string;
  assigneeId: string;
  assigneeName: string;
  delegateId: string;
  delegateName: string;
  labels: string[];
  estimate?: number;
}

export interface LifecycleDecision {
  mode: LifecycleMode;
  reason: string;
  currentState: string;
  assignedToAgent: boolean;
  delegatedToAgent: boolean;
  allowedTransitions: string[];
  issue?: LifecycleIssueContext;
}

export async function resolveLifecycleIssueContext(
  api: OpenClawPluginApi,
  cfg: PluginConfig,
  fallbackIssue: unknown,
  issueId: string,
): Promise<LifecycleIssueContext> {
  const fetched = issueId
    ? await fetchIssueContext(api, cfg, issueId)
    : undefined;
  return readIssueContext(fetched ?? fallbackIssue);
}

export async function classifyLifecycle(input: {
  api: OpenClawPluginApi;
  cfg: PluginConfig;
  action: string;
  prompt: string;
  issue: LifecycleIssueContext;
}): Promise<LifecycleDecision> {
  const viewerId = await resolveViewer(input.api, input.cfg);
  const issue = input.issue;
  const assignedToAgent = Boolean(viewerId && issue.assigneeId === viewerId);
  const delegatedToAgent = Boolean(viewerId && issue.delegateId === viewerId);
  const addressedToAgent = assignedToAgent || delegatedToAgent;
  const stateName = normalizeName(issue.stateName);
  const stateType = normalizeName(issue.stateType);
  const explicitOverride = hasExplicitExecutionOverride(input.prompt);
  const base = {
    currentState: issue.stateName || issue.stateType || "",
    assignedToAgent,
    delegatedToAgent,
    issue,
  };

  if (stateType === "completed" || stateType === "canceled" || stateName === "done") {
    return {
      ...base,
      mode: "ignore",
      reason: `issue is already ${issue.stateName || issue.stateType}`,
      allowedTransitions: [],
    };
  }

  if (stateName === "backlog" && addressedToAgent && !explicitOverride) {
    return {
      ...base,
      mode: "intake",
      reason: "issue is in Backlog and assigned/delegated to this agent",
      allowedTransitions: ["Todo"],
    };
  }

  if ((stateName === "todo" || stateName === "to do") && addressedToAgent && !explicitOverride) {
    return {
      ...base,
      mode: "todo_wait",
      reason: "issue is in Todo; Todo is manager-owned",
      allowedTransitions: [],
    };
  }

  if (stateName === "research") {
    return {
      ...base,
      mode: "research",
      reason: "issue is in Research",
      allowedTransitions: ["Research Review"],
    };
  }

  if (stateName === "research review" || stateName === "final review") {
    return {
      ...base,
      mode: "review_wait",
      reason: `issue is in ${issue.stateName}`,
      allowedTransitions: [],
    };
  }

  if (stateType === "started" || stateName === "in progress") {
    return {
      ...base,
      mode: "implementation",
      reason: `issue is in implementation state ${issue.stateName || issue.stateType}`,
      allowedTransitions: ["Final Review"],
    };
  }

  if (explicitOverride) {
    return {
      ...base,
      mode: "implementation",
      reason: "prompt contains an explicit execution override",
      allowedTransitions: ["Final Review"],
    };
  }

  return {
    ...base,
    mode: "reply_only",
    reason: addressedToAgent
      ? `no lifecycle rule matched state ${issue.stateName || issue.stateType || "(unknown)"}`
      : "issue is not assigned or delegated to this agent",
    allowedTransitions: [],
  };
}

export function buildLifecycleBlock(decision: LifecycleDecision | undefined): string {
  if (!decision) return "";
  const lines = [
    "## Task Lifecycle",
    "",
    `Mode: ${decision.mode}`,
    `Reason: ${decision.reason}`,
    decision.currentState ? `Current state: ${decision.currentState}` : "",
    decision.issue?.assigneeName ? `Assignee: ${decision.issue.assigneeName}` : "",
    decision.issue?.delegateName ? `Delegate: ${decision.issue.delegateName}` : "",
    decision.issue?.labels.length ? `Labels: ${decision.issue.labels.join(", ")}` : "",
    decision.issue?.estimate !== undefined ? `Estimate: ${decision.issue.estimate}` : "",
    decision.allowedTransitions.length
      ? `Allowed next states: ${decision.allowedTransitions.join(", ")}`
      : "",
    "",
    "Required behavior:",
    ...requiredBehavior(decision.mode),
  ];
  return lines.filter((line) => line !== "").join("\n");
}

async function fetchIssueContext(
  api: OpenClawPluginApi,
  cfg: PluginConfig,
  issueId: string,
): Promise<unknown> {
  const result = await callLinear(api, cfg, "issue(lifecycle)", {
    query: ISSUE_DETAIL_QUERY,
    variables: { id: issueId },
  });
  return result.ok ? result.data?.issue : undefined;
}

function readIssueContext(input: unknown): LifecycleIssueContext {
  const issue = readObject(input);
  const state = readObject(issue?.state);
  const team = readObject(issue?.team);
  const project = readObject(issue?.project);
  const assignee = readObject(issue?.assignee);
  const delegate = readObject(issue?.delegate);
  const labelRoot = readObject(issue?.labels);
  const labels = readArray(labelRoot?.nodes)
    .map((item) => readString(readObject(item)?.name))
    .filter((item): item is string => Boolean(item));
  return {
    id: readString(issue?.id) ?? "",
    identifier: readString(issue?.identifier) ?? "",
    title: readString(issue?.title) ?? "",
    description: readString(issue?.description) ?? "",
    url: readString(issue?.url) ?? "",
    stateId: readString(state?.id) ?? "",
    stateName: readString(state?.name) ?? "",
    stateType: readString(state?.type) ?? "",
    teamId: readString(team?.id) ?? "",
    teamKey: readString(team?.key) ?? "",
    teamName: readString(team?.name) ?? "",
    projectId: readString(project?.id) ?? "",
    projectName: readString(project?.name) ?? "",
    assigneeId: readString(assignee?.id) ?? "",
    assigneeName: readString(assignee?.displayName) ?? readString(assignee?.name) ?? "",
    delegateId: readString(delegate?.id) ?? "",
    delegateName: readString(delegate?.displayName) ?? readString(delegate?.name) ?? "",
    labels,
    estimate: typeof issue?.estimate === "number" ? issue.estimate : undefined,
  };
}

function normalizeName(input: string): string {
  return input.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function hasExplicitExecutionOverride(prompt: string): boolean {
  const normalized = normalizeName(prompt);
  return [
    "implement this",
    "start implementation",
    "begin implementation",
    "do the work now",
    "run the audit now",
    "override lifecycle",
  ].some((needle) => normalized.includes(needle));
}

function requiredBehavior(mode: LifecycleMode): string[] {
  if (mode === "intake") {
    return [
      "- Do not perform full implementation, audit, or code changes yet.",
      "- Inspect only enough context to clarify scope and repository ownership.",
      "- Improve the issue title, description, acceptance criteria, and repository context when needed.",
      "- Add missing labels and an estimate. Preserve existing labels and estimate unless there is a clear reason to change them.",
      "- Use query/team to resolve label IDs, then issue/update with labelIds and estimate.",
      "- Move the issue to Todo using issue/move-to-state.",
      "- Unassign yourself after moving it to Todo using issue/update with assigneeId: null.",
      "- Post a short intake summary and stop.",
    ];
  }
  if (mode === "todo_wait") {
    return [
      "- Treat Todo as manager-owned.",
      "- Do not automatically take, self-assign, or move the issue to Research.",
      "- If explicitly asked to prepare the issue, add missing context, acceptance criteria, open questions, labels, repository/component, and estimate where possible, then leave it in Todo.",
      "- Do not start research or implementation unless the manager explicitly moves the issue to Research or gives an explicit override.",
    ];
  }
  if (mode === "research") {
    return [
      "- Only take this work because the issue is already in Research.",
      "- Assign the issue to yourself if needed and keep yourself assigned.",
      "- Investigate constraints and existing code without starting implementation.",
      "- Prepare a concrete plan with risks, blockers, and verification strategy.",
      "- Move the issue to Research Review when research is complete.",
      "- Stop and wait for manager input before implementation.",
    ];
  }
  if (mode === "implementation") {
    return [
      "- Implement only the scoped task.",
      "- Protect unrelated local changes and check worktree status before edits.",
      "- Run fresh verification before reporting completion.",
      "- Move or ask to move the issue to Final Review when implementation is complete; do not mark Done directly.",
    ];
  }
  if (mode === "review_wait") {
    return [
      "- Do not start implementation.",
      "- Answer direct questions, summarize status, or ask for the missing decision.",
      "- Leave the issue in its current review state unless explicitly instructed otherwise.",
    ];
  }
  if (mode === "ignore") {
    return [
      "- Do not modify the issue or repository.",
      "- Only respond if the user explicitly asks a question.",
    ];
  }
  return [
    "- Treat this as a reply-only Linear interaction.",
    "- Do not move workflow state or start implementation unless the prompt explicitly asks for it.",
  ];
}
