# OpenClaw Setup

This guide describes the OpenClaw-side configuration for `linear-agent-bridge`.

## Build The Plugin

```bash
git clone https://github.com/d1r1-ai/linear-agent-bridge.git
cd linear-agent-bridge
npm install
npm run build
```

Install or mount the plugin according to your OpenClaw plugin loading setup. The plugin manifest is `openclaw.plugin.json`.

## Store Secrets Outside Git

Create a secret file on the server:

```bash
mkdir -p ~/.openclaw/secrets
cp templates/secrets.linear.example.json ~/.openclaw/secrets/linear.json
chmod 600 ~/.openclaw/secrets/linear.json
```

Fill the values from the Linear application page. Do not commit this file.

## Configure Secret Provider

Add a file-backed secret provider to your OpenClaw config:

```json
{
  "secrets": {
    "providers": {
      "linear": {
        "source": "file",
        "path": "~/.openclaw/secrets/linear.json",
        "mode": "json"
      }
    }
  }
}
```

## Configure The Plugin

Start from `templates/openclaw.config.example.json` and adjust:

- `devAgentId`: OpenClaw agent id that should handle Linear work.
- `linearOauthRedirectUri`: public HTTPS callback URL.
- `apiBaseUrl`: public HTTPS URL for the agent API proxy.
- `defaultDir`: fallback local working directory.
- `repoByTeam` / `repoByProject`: optional repository routing.

Recommended lifecycle-safe flags:

```json
{
  "enableAgentApi": true,
  "delegateOnCreate": false,
  "startOnCreate": false,
  "strictAddressing": false
}
```

`delegateOnCreate` and `startOnCreate` default to `false` because a new Linear session should enter the workflow at intake/research. Implementation starts only from `In Progress` or with an explicit human override.

## Add Agent Instructions

Copy `templates/AGENTS.linear-task-lifecycle.md` into your workspace or repository `AGENTS.md`.

The plugin injects a runtime lifecycle block, but the `AGENTS.md` policy is still useful for normal Codex/OpenClaw behavior, manual Linear work, and future portability.

## Restart Gateway

```bash
systemctl --user restart openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

Use your process manager's equivalent if OpenClaw Gateway is not managed by user-level systemd.

