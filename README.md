# linear-agent-bridge

OpenClaw plugin for running an agent from Linear Agent Sessions.

The plugin receives Linear webhooks, verifies the Linear signing secret, starts an OpenClaw agent, gives it a short-lived Linear API proxy token, and injects a task lifecycle block so the agent behaves consistently across `Backlog`, `Research`, `In Progress`, and review states.

## What You Get

- Linear Agent Session webhook receiver at `/plugins/linear/linear`
- Agent-callable Linear API proxy at `/plugins/linear/api`
- OAuth callback/exchange routes for Linear app tokens
- HMAC verification with the Linear webhook signing secret
- Per-session bearer tokens for agent API calls
- Lifecycle routing for Linear workflow states
- Safe workflow transition helper: `issue/move-to-state`
- Copy-paste setup templates for OpenClaw config, secrets, and `AGENTS.md`

## Quick Start

1. Clone and build the plugin.

```bash
git clone https://github.com/d1r1-ai/linear-agent-bridge.git
cd linear-agent-bridge
npm install
npm run build
```

2. Expose OpenClaw through a public HTTPS reverse proxy.

Linear must reach:

```text
https://linear.example.com/plugins/linear/linear
```

Agents must call back to:

```text
https://linear.example.com/plugins/linear/api
```

See [Reverse Proxy](docs/REVERSE_PROXY.md) for generic requirements plus Caddy and Nginx examples.

3. Create/configure a Linear app.

Use [Linear Setup](docs/LINEAR_SETUP.md) to find the app page, webhook URL, OAuth redirect URL, signing secret, client ID, and client secret.

4. Store secrets outside the repo.

Copy [templates/secrets.linear.example.json](templates/secrets.linear.example.json) to your server secret path and fill it with values from Linear.

5. Add plugin config to OpenClaw.

Start from [templates/openclaw.config.example.json](templates/openclaw.config.example.json). The recommended production flags are:

```json
{
  "enableAgentApi": true,
  "delegateOnCreate": false,
  "startOnCreate": false,
  "strictAddressing": false
}
```

6. Add the lifecycle policy to your agent instructions.

Copy [templates/AGENTS.linear-task-lifecycle.md](templates/AGENTS.linear-task-lifecycle.md) into your workspace or repo `AGENTS.md`.

7. Restart OpenClaw Gateway.

```bash
systemctl --user restart openclaw-gateway.service
```

8. Smoke test from Linear.

Create a test issue in `Backlog`, assign or delegate it to the Linear app user, and confirm:

- OpenClaw logs `linear lifecycle: mode=intake`
- the issue is clarified and moved to `Todo` or `Research`
- the agent does not start implementation from `Backlog`

## Task Lifecycle

This fork is intentionally workflow-aware:

```text
Backlog + assigned/delegated to agent -> intake only -> Todo or Research
Todo -> first pickup -> Research
Research -> investigate and plan -> Research Review
Research Review -> wait for manager input
In Progress -> implementation
Final Review -> wait for review
Done -> no work
```

The plugin injects the detected lifecycle mode into the agent prompt. The `AGENTS.md` policy is still required so agents have durable behavioral rules outside this plugin.

Full details: [Task Lifecycle](docs/TASK_LIFECYCLE.md).

## Documentation

- [OpenClaw Setup](docs/OPENCLAW_SETUP.md)
- [Linear Setup](docs/LINEAR_SETUP.md)
- [Reverse Proxy](docs/REVERSE_PROXY.md)
- [Task Lifecycle](docs/TASK_LIFECYCLE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Configuration Templates

- [OpenClaw config example](templates/openclaw.config.example.json)
- [Linear secrets example](templates/secrets.linear.example.json)
- [AGENTS lifecycle snippet](templates/AGENTS.linear-task-lifecycle.md)

## Security Notes

- Keep `linearWebhookSecret`, OAuth client secret, access tokens, and session bearer tokens out of git.
- Prefer OpenClaw SecretRefs over literal secrets in config.
- The webhook endpoint rejects unsigned Linear requests.
- Agent API tokens are scoped to one Linear session and revoked when the run completes.
- Agent responses are redacted for common bearer/token/secret patterns before posting back to Linear.

## Development

```bash
npm install
npm run build
```

There is no separate test runner yet; `npm run build` is the minimum verification gate.

## License

MIT
