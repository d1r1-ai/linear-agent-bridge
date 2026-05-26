# Reverse Proxy

Linear must reach OpenClaw Gateway over public HTTPS. The bridge does not require Caddy specifically; any reverse proxy works if it preserves the path, method, body, and headers.

## Public Routes

Expose:

```text
https://linear.example.com/plugins/linear/linear
https://linear.example.com/plugins/linear/api
https://linear.example.com/plugins/linear/oauth/callback
```

Proxy those paths to the OpenClaw Gateway listener, for example:

```text
http://127.0.0.1:18789
```

## Requirements

- Use valid HTTPS.
- Preserve `/plugins/linear/*` paths.
- Preserve request bodies for POST webhooks.
- Do not strip `linear-signature`, `linear-delivery`, `authorization`, or `content-type`.
- Forward `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`.
- Keep the endpoint reachable from Linear's servers.

## Caddy Example

```caddyfile
linear.example.com {
  handle /plugins/linear/* {
    reverse_proxy 127.0.0.1:18789
  }
}
```

## Nginx Example

```nginx
server {
  listen 443 ssl http2;
  server_name linear.example.com;

  ssl_certificate /etc/letsencrypt/live/linear.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/linear.example.com/privkey.pem;

  location /plugins/linear/ {
    proxy_pass http://127.0.0.1:18789;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Cloudflare Note

If you use Cloudflare, start with `DNS only` while issuing origin certificates. After TLS works, proxied mode is fine for ordinary HTTPS routing if your origin TLS mode is correct.

