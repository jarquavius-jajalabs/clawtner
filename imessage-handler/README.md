# Clawtner iMessage Handler

Bridge between Clawtner webhooks and iMessage via `imsg` CLI.

## Setup

```bash
# Start the handler
bun run server.ts

# Or with a secret
WEBHOOK_SECRET=my-secret bun run server.ts
```

## Clawtner Configuration

In Clawtner Settings > Delivery Channels, add:

- **Name:** imessage-mac
- **URL:** `http://localhost:3847/hooks/imessage`
- **Method:** POST
- **Contacts:** Select contacts that use iMessage

## Running as a Background Service

```bash
# Using launchd (macOS)
# Copy the plist to ~/Library/LaunchAgents/ and load it

# Or just run in background
nohup bun run server.ts > /tmp/clawtner-imessage.log 2>&1 &
```

## Health Check

```bash
curl http://localhost:3847/health
```
