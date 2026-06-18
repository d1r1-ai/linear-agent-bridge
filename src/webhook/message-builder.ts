import { readObject, readString } from "../util.js";
import { buildLifecycleBlock, type LifecycleDecision } from "./lifecycle.js";

export interface MessageParams {
  action: string;
  id: string;
  title: string;
  url: string;
  desc: string;
  guidance: string;
  prompt: string;
  repo: string;
  session: string;
  context: string;
  compact?: boolean;
  lifecycle?: LifecycleDecision;
}

export function buildLabel(id: string, title: string): string {
  if (id && title) return `Linear ${id} ${title}`.slice(0, 80);
  if (id) return `Linear ${id}`;
  if (title) return `Linear ${title}`.slice(0, 80);
  return "Linear issue";
}

export function buildMessage(params: MessageParams): string {
  const compact = params.compact === true;
  const issueLine =
    params.id || params.title
      ? `Linear issue: ${params.id} ${params.title}`.trim()
      : "";
  const actionLine = params.action
    ? `Linear action: ${params.action}`
    : "";
  const guidanceLine = compact
    ? ""
    : params.context
      ? ""
      : params.guidance
        ? `Guidance:\n${params.guidance}`
        : "";
  const descLine = compact
    ? ""
    : params.context
      ? ""
      : params.desc
        ? `Description:\n${params.desc}`
        : "";
  const contextLine = compact
    ? ""
    : params.context
      ? `Prompt context:\n${params.context}`
      : "";
  const lifecycleLine = compact ? "" : buildLifecycleBlock(params.lifecycle);
  const lines = [
    actionLine,
    issueLine,
    params.url ? `URL: ${params.url}` : "",
    params.repo ? `Repo: ${params.repo}` : "",
    params.repo
      ? ""
      : "Repository: unresolved. Read Linear issue metadata, accepted research plan, repo labels, or explicit repository URLs before choosing a repo. If still unclear, ask for the repository; do not guess from local keyword matches or default directories.",
    params.session ? `Agent session: ${params.session}` : "",
    lifecycleLine,
    contextLine,
    params.prompt ? `User prompt:\n${params.prompt}` : "",
    guidanceLine,
    descLine,
  ];
  return lines.filter(Boolean).join("\n\n");
}

export function buildThought(
  action: string,
  id: string,
  title: string,
): string {
  const target =
    id || title ? `${id} ${title}`.trim() : "Linear issue";
  if (action === "prompted") {
    return `Received an update on ${target}. Continuing work.`;
  }
  return `Starting work on ${target}.`;
}

export function buildStopText(id: string, title: string): string {
  const target =
    id || title ? `${id} ${title}`.trim() : "this request";
  return `Stop request received. I will halt work on ${target}.`;
}

export function resolveRepo(
  cfg: { repoByProject?: Record<string, string>; repoByTeam?: Record<string, string> },
  team: string,
  proj: string,
): string {
  if (proj && cfg.repoByProject?.[proj]) return cfg.repoByProject[proj];
  if (team && cfg.repoByTeam?.[team]) return cfg.repoByTeam[team];
  return "";
}

export function resolveRepoFromIssueText(values: string[]): string {
  for (const value of values) {
    const repo = extractGithubRepo(value);
    if (repo) return repo;
  }
  for (const value of values) {
    const repo = extractNamedRepo(value);
    if (repo) return repo;
  }
  return "";
}

function extractGithubRepo(value: string): string {
  const text = value.trim();
  if (!text) return "";
  const httpsMatch = text.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)(?:\.git)?(?:[/?#\s)]|$)/i,
  );
  const sshMatch = text.match(
    /git@github\.com:([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)(?:\.git)?(?:\s|$)/i,
  );
  const repo = httpsMatch?.[1] ?? sshMatch?.[1] ?? "";
  return repo ? `https://github.com/${repo}` : "";
}

function extractNamedRepo(value: string): string {
  const text = value.trim();
  if (!text) return "";
  const match = text.match(
    /(?:^|\n|\s)(?:repo|repository)\s*:\s*([^\s,;]+)/i,
  );
  return cleanRepoToken(match?.[1] ?? "");
}

function cleanRepoToken(value: string): string {
  return value.trim().replace(/[).,\];]+$/g, "");
}

export function resolveAction(data: Record<string, unknown>): string {
  const kind = readString(data.type as string) ?? "";
  const rawAction = (readString(data.action as string) ?? "")
    .trim()
    .toLowerCase();
  if (kind === "Comment") {
    if (
      rawAction &&
      rawAction !== "create" &&
      rawAction !== "created" &&
      rawAction !== "prompted"
    )
      return "";
    return "prompted";
  }
  if (rawAction === "create" || rawAction === "created") return "created";
  if (rawAction === "prompt" || rawAction === "prompted") return "prompted";
  return "";
}

export function resolvePrompt(data: Record<string, unknown>): string {
  const activity = readObject(data.agentActivity);
  const direct = readString(activity?.body);
  if (direct) return direct;
  const content = readObject(activity?.content);
  const body = readString(content?.body);
  if (body) return body;
  const comment = readObject(data.comment);
  return (
    readString(comment?.body) ??
    readString(data.body as string) ??
    readString(data.message as string) ??
    ""
  );
}

export function resolveSignal(data: Record<string, unknown>): string {
  const activity = readObject(data.agentActivity);
  const signal = readString(activity?.signal);
  return signal || readString(data.signal as string) || "";
}

export function resolveContext(data: Record<string, unknown>): string {
  return readString(data.promptContext as string) ?? "";
}

export function resolveKey(input: unknown): string {
  const obj = readObject(input);
  if (!obj) return "";
  return readString(obj.key) ?? readString(obj.id) ?? readString(obj.name) ?? "";
}

export function resolveExternal(
  cfg: { externalUrlBase?: string; externalUrlLabel?: string },
  session: string,
  issueId: string,
): { url: string; label: string } | null {
  const base = cfg.externalUrlBase ?? "";
  const label = cfg.externalUrlLabel ?? "OpenClaw session";
  const url = buildExternalUrl(base, session, issueId);
  return url ? { url, label } : null;
}

function buildExternalUrl(
  base: string,
  session: string,
  issueId: string,
): string {
  const raw = base.trim();
  if (!raw) return "";
  const sessionToken = session ?? "";
  const issueToken = issueId ?? "";
  const needsSession =
    raw.includes("{session}") || raw.includes("${session}");
  const needsIssue =
    raw.includes("{issue}") || raw.includes("${issue}");
  if (needsSession && !sessionToken) return "";
  if (needsIssue && !issueToken) return "";
  if (needsSession || needsIssue) {
    return raw
      .replaceAll("{session}", sessionToken)
      .replaceAll("${session}", sessionToken)
      .replaceAll("{issue}", issueToken)
      .replaceAll("${issue}", issueToken);
  }
  if (!URL.canParse(raw)) return "";
  const url = new URL(raw);
  if (sessionToken) url.searchParams.set("session", sessionToken);
  if (issueToken) url.searchParams.set("issue", issueToken);
  return url.toString();
}
