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
- `repoByTeam` / `repoByProject`: optional repository routing. If no mapping matches, the agent is told to read the repository from the Linear issue itself (description, labels, or accepted research plan) and to ask the manager when ownership is unclear.

Recommended lifecycle-safe flags:

```json
{
  "enableAgentApi": true,
  "delegateOnCreate": false,
  "startOnCreate": false,
  "strictAddressing": true
}
```

`delegateOnCreate` and `startOnCreate` default to `false` because a new Linear session should follow the issue workflow state instead of starting implementation. Backlog enters intake, Todo waits for manager action, Research performs planning, and implementation starts only from `In Progress` or with an explicit human override.

Keep `strictAddressing` enabled when Linear issues may mention multiple agents. With strict addressing, assigned/delegated issues can start the agent lifecycle, and replies inside an existing Linear agent session can omit the handle only when the issue belongs to that agent.

## Add Agent Instructions

Copy `templates/AGENTS.linear-task-lifecycle.md` into your workspace or repository `AGENTS.md`.

The plugin injects a runtime lifecycle block, but the `AGENTS.md` policy is still useful for normal Codex/OpenClaw behavior, manual Linear work, and future portability.

## Restart Gateway

```bash
systemctl --user restart openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

Use your process manager's equivalent if OpenClaw Gateway is not managed by user-level systemd.
