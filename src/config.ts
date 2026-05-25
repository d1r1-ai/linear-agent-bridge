import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

import type { PluginConfig } from "./types.js";

export function normalizeCfg(
  input: Record<string, unknown> | undefined,
  rootConfig?: Record<string, unknown>,
): PluginConfig {
  const cfg = input ?? {};
  return {
    devAgentId: readCfgString(cfg, "devAgentId"),
    linearWebhookSecret: readCfgString(cfg, "linearWebhookSecret", rootConfig),
    linearApiKey: readCfgString(cfg, "linearApiKey", rootConfig),
    linearOauthClientId: readCfgString(cfg, "linearOauthClientId", rootConfig),
    linearOauthClientSecret: readCfgString(cfg, "linearOauthClientSecret", rootConfig),
    linearOauthRedirectUri: readCfgString(cfg, "linearOauthRedirectUri"),
    linearTokenStorePath: readCfgString(cfg, "linearTokenStorePath"),
    notifyChannel: readCfgString(cfg, "notifyChannel"),
    notifyTo: readCfgString(cfg, "notifyTo"),
    notifyAccountId: readCfgString(cfg, "notifyAccountId"),
    repoByTeam: readCfgMap(cfg, "repoByTeam"),
    repoByProject: readCfgMap(cfg, "repoByProject"),
    defaultDir: readCfgString(cfg, "defaultDir"),
    delegateOnCreate: readCfgBool(cfg, "delegateOnCreate"),
    startOnCreate: readCfgBool(cfg, "startOnCreate"),
    externalUrlBase: readCfgString(cfg, "externalUrlBase"),
    externalUrlLabel: readCfgString(cfg, "externalUrlLabel"),
    enableAgentApi: readCfgBool(cfg, "enableAgentApi"),
    apiBaseUrl: readCfgString(cfg, "apiBaseUrl"),
    strictAddressing: readCfgBool(cfg, "strictAddressing"),
    mentionHandle: readCfgString(cfg, "mentionHandle"),
    apiCorsOrigins: readCfgStringArray(cfg, "apiCorsOrigins"),
    apiCorsAllowCredentials: readCfgBool(cfg, "apiCorsAllowCredentials"),
  };
}

function readCfgString(
  cfg: Record<string, unknown>,
  key: string,
  rootConfig?: Record<string, unknown>,
): string | undefined {
  const raw = cfg[key];
  const resolved = typeof raw === "string" ? raw : resolveSecretRefString(raw, rootConfig);
  if (typeof resolved !== "string") return undefined;
  const value = resolved.trim();
  return value || undefined;
}

function resolveSecretRefString(
  raw: unknown,
  rootConfig: Record<string, unknown> | undefined,
): string | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const ref = raw as Record<string, unknown>;
  const source = ref.source;
  const provider = ref.provider;
  const id = ref.id;
  if (typeof source !== "string" || typeof provider !== "string" || typeof id !== "string") {
    return undefined;
  }

  if (source === "env") return process.env[id];
  if (source !== "file") return undefined;

  const providerCfg = readSecretProvider(rootConfig, provider);
  if (!providerCfg || providerCfg.source !== "file") return undefined;
  const filePath = expandHome(providerCfg.path);
  if (!filePath) return undefined;

  try {
    const text = readFileSync(filePath, "utf8");
    if (providerCfg.mode === "singleValue") return text.trim();
    if (providerCfg.mode !== "json") return undefined;

    const parsed = JSON.parse(text) as unknown;
    const value = readJsonPointer(parsed, id);
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

function readSecretProvider(
  rootConfig: Record<string, unknown> | undefined,
  provider: string,
): { source: string; path?: string; mode?: string } | undefined {
  const secrets = readRecord(rootConfig?.secrets);
  const providers = readRecord(secrets?.providers);
  const cfg = readRecord(providers?.[provider]);
  const source = cfg?.source;
  if (!cfg || typeof source !== "string") return undefined;
  return {
    source,
    path: typeof cfg.path === "string" ? cfg.path : undefined,
    mode: typeof cfg.mode === "string" ? cfg.mode : undefined,
  };
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function expandHome(filePath: string | undefined): string | undefined {
  if (!filePath) return undefined;
  if (filePath === "~") return homedir();
  if (filePath.startsWith("~/")) return path.join(homedir(), filePath.slice(2));
  return filePath;
}

function readJsonPointer(value: unknown, pointer: string): unknown {
  if (!pointer.startsWith("/")) return undefined;
  let current = value;
  for (const rawPart of pointer.slice(1).split("/")) {
    const part = rawPart.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function readCfgBool(
  cfg: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const raw = cfg[key];
  if (typeof raw !== "boolean") return undefined;
  return raw;
}

function readCfgMap(
  cfg: Record<string, unknown>,
  key: string,
): Record<string, string> | undefined {
  const raw = cfg[key];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const map = raw as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    if (typeof v === "string" && v.trim()) {
      out[k] = v.trim();
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}


function readCfgStringArray(
  cfg: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const raw = cfg[key];
  if (!Array.isArray(raw)) return undefined;
  const values = raw
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}
