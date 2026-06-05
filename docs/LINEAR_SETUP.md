# Linear Setup

Use one Linear application as the source of agent-session webhooks and OAuth credentials.

## Create The Application

In Linear, open:

```text
Workspace settings -> API -> Applications
```

Create or edit the application for this bridge.

## Application URLs

Set the OAuth redirect URL:

```text
https://linear.example.com/plugins/linear/oauth/callback
```

Set the webhook URL:

```text
https://linear.example.com/plugins/linear/linear
```

Replace `linear.example.com` with your public hostname.

## Required Events

Enable:

- Agent session events
- Issues
- Comments

Agent session events are the critical trigger. Issue and comment events let the bridge resolve issue context, session threads, and human replies.

Prefer a single Linear application webhook for this endpoint. A separate generic webhook can have a different signing secret, which will fail verification unless the server is explicitly configured to accept that secret.

## Credentials To Copy

From the Linear application page, copy:

- Client ID
- Client secret
- Signing webhook secret

Store them in the server secret file, not in git.

## OAuth Scopes

Authorize the app with scopes that let it read issues, write comments, be assigned or mentioned, and create issues when needed:

```text
read,write,issues:create,comments:create,app:assignable,app:mentionable
```

Use the app actor for agent work.

## Smoke Test

Create a test issue in `Backlog`, assign or delegate it to the app user, and check:

- Linear delivery logs show a successful webhook delivery.
- OpenClaw Gateway logs show `linear lifecycle: mode=intake`.
- The issue is clarified, moved to `Todo`, and unassigned from the agent.
- The agent does not begin implementation from `Backlog`.
