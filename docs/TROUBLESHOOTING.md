# Troubleshooting

## Check Gateway Logs

```bash
journalctl --user -u openclaw-gateway.service --since '10 min ago' --no-pager | rg -i 'linear|webhook|lifecycle|error'
```

Use the equivalent command for your process manager if Gateway is not managed by user-level systemd.

## Check Linear Delivery Logs

Linear's application/webhook page shows transport-level delivery status: HTTP code, retry attempts, and response body. Use it to confirm Linear reached your server.

OpenClaw logs are still the source of truth for signature verification, lifecycle classification, agent spawning, and API proxy errors.

## Common Issues

### Signature Verification Fails

Likely causes:

- `linearWebhookSecret` does not match the webhook source.
- The request comes from a separate generic webhook with a different secret.
- The reverse proxy modifies the body before it reaches OpenClaw.

Prefer one Linear application webhook and copy its signing secret into `~/.openclaw/secrets/linear.json`.

### Agent Does Not Start

Check:

- `Agent session events` are enabled in the Linear application.
- Webhook URL is `/plugins/linear/linear`.
- Gateway is reachable over public HTTPS.
- `enableAgentApi` is `true`.
- Gateway logs show the expected lifecycle mode.

### Issue Stays In Backlog

Check that the Linear workflow has a target state named `Todo` or `Research`, and that the app token has permission to update issues.

### Manual Curl Gets 401

That is expected for unsigned webhook requests. Linear webhooks are accepted only when the signature matches the configured signing secret.

### Agent Posts Secrets

The bridge redacts common bearer/token/secret patterns before posting back to Linear, but prompts and repository instructions should still tell agents not to print secrets.

