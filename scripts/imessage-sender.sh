#!/bin/bash
# iMessage sender - polls Clawtner for queued messages and sends via imsg
# Run via cron: * * * * * /path/to/imessage-sender.sh

API_URL="https://clawtner.pages.dev"
API_KEY="" # Set this

# Get queued messages
QUEUED=$(curl -sf "$API_URL/api/messages/queued" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json")

if [ -z "$QUEUED" ] || [ "$QUEUED" = "[]" ]; then
  exit 0
fi

# Process each message
echo "$QUEUED" | jq -c '.messages[]' | while read -r msg; do
  ID=$(echo "$msg" | jq -r '.id')
  HISTORY_ID=$(echo "$msg" | jq -r '.history_id')
  PHONE=$(echo "$msg" | jq -r '.to_number')
  TEXT=$(echo "$msg" | jq -r '.message')

  # Send via imsg
  if imsg send --to "$PHONE" --text "$TEXT" 2>/dev/null; then
    # Mark as sent
    curl -sf "$API_URL/api/messages/status" \
      -X POST \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"log_id\": \"$ID\", \"history_id\": \"$HISTORY_ID\", \"status\": \"delivered\"}"
  else
    # Mark as failed
    curl -sf "$API_URL/api/messages/status" \
      -X POST \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"log_id\": \"$ID\", \"history_id\": \"$HISTORY_ID\", \"status\": \"failed\", \"error\": \"imsg send failed\"}"
  fi
done
