#!/usr/bin/env bash
# =============================================================================
# scripts/deployment-logs.sh
#
# Inspect the latest Vercel deployment for this project.
#   - If the deployment FAILED  → stream the full build logs.
#   - If the deployment SUCCEEDED → print a concise summary.
#
# Usage:
#   bash scripts/deployment-logs.sh          # auto-detects latest deployment
#   bash scripts/deployment-logs.sh [url]    # inspect a specific deployment URL
#
# Requires: Vercel CLI v50+, Git Bash on Windows
# =============================================================================

# NOTE: No `set -euo pipefail` — unreliable in MINGW/Git Bash pipe chains.
# Exit codes are checked explicitly where needed.

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}${BOLD}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}${BOLD}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}${BOLD}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}${BOLD}[ERROR]${RESET} $*"; }
divider() { echo -e "${CYAN}──────────────────────────────────────────────────────────────────────${RESET}"; }

# ── parse_json_field <json_string> <field_name> ───────────────────────────────
# Extracts a scalar string value from pretty-printed JSON without jq.
# Handles both `"key": "value"` and `"key":"value"` formats.
# Strips surrounding quotes and trailing commas/whitespace.
parse_json_field() {
  local json="$1"
  local field="$2"
  echo "$json" \
    | grep -m1 "\"${field}\"" \
    | sed 's/.*"'"${field}"'"[[:space:]]*:[[:space:]]*"//;s/".*//' \
    | tr -d '\r\n'
}

# ── Preflight ─────────────────────────────────────────────────────────────────
if ! command -v vercel > /dev/null 2>&1; then
  error "Vercel CLI not found. Install it with: npm i -g vercel"
  exit 1
fi

# ── Resolve deployment URL ────────────────────────────────────────────────────
DEPLOYMENT_URL="${1:-}"
LIST_STATE=""

if [ -z "$DEPLOYMENT_URL" ]; then
  info "No URL supplied — fetching latest deployment from Vercel..."

  # Capture stdout; suppress stderr preamble ("Vercel CLI x.x / Retrieving project…").
  # `tr -d '\r'` strips Windows CRLF so grep/sed work correctly in Git Bash.
  RAW_LIST=$(vercel list -F json 2>/dev/null | tr -d '\r')
  LIST_EXIT=${PIPESTATUS[0]}

  if [ "$LIST_EXIT" -ne 0 ] || [ -z "$RAW_LIST" ]; then
    error "Failed to fetch deployments (vercel exit code: $LIST_EXIT)."
    error "Make sure you are logged in: vercel whoami"
    exit 1
  fi

  # Parse URL and state from the pretty-printed JSON.
  # The JSON is multi-line with spaces: `"url": "gitglide-xxx.vercel.app",`
  DEPLOYMENT_URL=$(parse_json_field "$RAW_LIST" "url")
  LIST_STATE=$(parse_json_field "$RAW_LIST" "state")

  if [ -z "$DEPLOYMENT_URL" ]; then
    error "Could not parse a deployment URL from the response."
    echo "--- Raw response (first 800 chars) ---"
    echo "${RAW_LIST:0:800}"
    exit 1
  fi
fi

# Strip leading https:// if the caller passed a full URL.
DEPLOYMENT_URL="${DEPLOYMENT_URL#https://}"

echo ""
divider
info "Deployment URL : ${BOLD}https://${DEPLOYMENT_URL}${RESET}"
divider

# ── Determine state ───────────────────────────────────────────────────────────
STATE=$(echo "$LIST_STATE" | tr '[:lower:]' '[:upper:]' | tr -d '\r\n')

# If a URL was passed manually, we need to inspect to get the state.
if [ -z "$STATE" ]; then
  info "Inspecting deployment to determine state..."
  INSPECT_JSON=$(vercel inspect "https://${DEPLOYMENT_URL}" -F json 2>/dev/null | tr -d '\r')

  # vercel inspect JSON uses "readyState" in some CLI versions, "state" in others.
  STATE=$(parse_json_field "$INSPECT_JSON" "readyState")
  if [ -z "$STATE" ]; then
    STATE=$(parse_json_field "$INSPECT_JSON" "state")
  fi
  STATE=$(echo "$STATE" | tr '[:lower:]' '[:upper:]')
fi

echo ""
info "Deployment state: ${BOLD}${STATE:-UNKNOWN}${RESET}"
echo ""

# ── Act on state ──────────────────────────────────────────────────────────────
case "$STATE" in

  READY)
    divider
    success "Deployment is ${GREEN}${BOLD}READY${RESET} ✓"
    echo ""
    # Human-readable summary (non-JSON inspect).
    vercel inspect "https://${DEPLOYMENT_URL}" 2>&1
    echo ""
    success "Live URL → https://${DEPLOYMENT_URL}"
    divider
    ;;

  ERROR|CANCELED|FAILED)
    divider
    error "Deployment ${RED}${BOLD}${STATE}${RESET} — streaming full build logs..."
    divider
    echo ""
    # `vercel inspect --logs` streams the complete build + runtime logs.
    vercel inspect "https://${DEPLOYMENT_URL}" --logs 2>&1
    echo ""
    divider
    error "Deployment ended with state: ${STATE}"
    error "Fix the issues shown above, then push again."
    divider
    exit 1
    ;;

  BUILDING|QUEUED|INITIALIZING)
    divider
    warn "Deployment is still in progress (state: ${STATE})."
    warn "Wait for it to finish, then re-run:"
    warn "  bun logs:deployment"
    divider
    ;;

  ""|UNKNOWN)
    divider
    warn "Could not determine deployment state."
    warn "Run manually to see build logs:"
    warn "  vercel inspect https://${DEPLOYMENT_URL} --logs"
    divider
    ;;

  *)
    divider
    warn "Unrecognised state: '${STATE}'"
    warn "Run manually: vercel inspect https://${DEPLOYMENT_URL} --logs"
    divider
    ;;

esac
