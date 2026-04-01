#!/bin/bash
# Schedule firer - checks for due schedules and generates drafts
# Run via cron: * * * * * /path/to/fire-schedules.sh

API_URL="https://clawtner.pages.dev"
API_KEY="clw_ebdf0bf3580b4486b534b6291b3ca19d"

curl -sf "$API_URL/api/cron/fire-schedules" \
  -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json"
