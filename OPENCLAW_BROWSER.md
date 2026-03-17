# OpenClaw Browser Quick Guide

This machine already has OpenClaw browser control available through the local browser control HTTP service.

## Base URLs

- Gateway UI: `http://127.0.0.1:18789/`
- Browser control API: `http://127.0.0.1:18791/`

## Auth

Use the gateway bearer token in the `Authorization` header:

```text
Authorization: Bearer <gateway.auth.token>
```

The token is stored in `~/.openclaw/openclaw.json` at `gateway.auth.token`.

## Current Reality On This Machine

- The browser control HTTP service works.
- Starting the browser via HTTP works.
- Listing tabs and taking snapshots via HTTP works.
- `openclaw browser ...` CLI commands may fail because the local gateway WebSocket handshake is timing out.
- Use the browser HTTP API first. Do not depend on the CLI browser subcommand unless it is re-verified.

## Recommended Flow

1. Check browser status.
2. Start the browser if it is not running.
3. Open a tab.
4. List tabs.
5. Capture a snapshot.
6. Act on the page with the browser routes.

## PowerShell Setup

```powershell
$TOKEN = '<gateway.auth.token>'
$H = @{ Authorization = "Bearer $TOKEN" }
```

## Status

```powershell
Invoke-RestMethod -Method Get -Uri http://127.0.0.1:18791/ -Headers $H
```

Expected useful fields:

- `running`
- `cdpReady`
- `cdpHttp`
- `detectedExecutablePath`

## Start Browser

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18791/start -Headers $H -ContentType 'application/json' -Body '{}'
```

## Stop Browser

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18791/stop -Headers $H -ContentType 'application/json' -Body '{}'
```

## Open A Tab

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18791/tabs/open -Headers $H -ContentType 'application/json' -Body '{"url":"https://example.com"}'
```

## List Tabs

```powershell
Invoke-RestMethod -Method Get -Uri http://127.0.0.1:18791/tabs -Headers $H | ConvertTo-Json -Depth 10
```

Useful tab fields:

- `targetId`
- `title`
- `url`

## Focus A Tab

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18791/tabs/focus -Headers $H -ContentType 'application/json' -Body '{"targetId":"<TARGET_ID>"}'
```

## Snapshot

```powershell
Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:18791/snapshot?limit=50' -Headers $H | ConvertTo-Json -Depth 10
```

If a page is empty, the snapshot may be an empty string.

## Screenshot

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18791/screenshot -Headers $H -ContentType 'application/json' -Body '{}'
```

## Navigate Current Tab

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:18791/navigate -Headers $H -ContentType 'application/json' -Body '{"url":"https://example.com"}'
```

## Existing Chrome Tabs vs OpenClaw Browser

There are two modes:

- OpenClaw managed browser:
  Use the HTTP API above. This is the reliable path on this machine.
- Existing normal Chrome tab:
  Requires the `OpenClaw Browser Relay` Chrome extension to be loaded and turned `ON` on the target tab.

If the task only requires browser automation, prefer the OpenClaw managed browser.

## Troubleshooting

### Browser API works but CLI fails

Symptom:

- `openclaw browser status` times out

Meaning:

- The browser HTTP service is healthy, but the gateway WebSocket CLI path is failing handshake on this machine.

Action:

- Keep using `http://127.0.0.1:18791/` with bearer auth.

### Browser not running

Symptom:

- Status shows `running: false`

Action:

- Call `POST /start`

### No useful page content

Symptom:

- Snapshot is empty

Meaning:

- The active tab is likely `about:blank` or not loaded yet.

Action:

- Open a URL first, then snapshot again.

## Rule Of Thumb

- Prefer browser HTTP endpoints over `openclaw browser` CLI on this machine.
- Verify `running: true` and `cdpReady: true` before attempting page actions.
- Use `tabs` plus `snapshot` as the first diagnostic pair.
