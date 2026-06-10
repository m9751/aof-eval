#!/usr/bin/env bash
# DC8: Banned causal-token lint for dashboard output templates.
#
# Scans components/, app/, and lib/ for tokens that imply causal claims
# in DPMO output (e.g. "this rule caused a reduction").
#
# Banned tokens: caused, causes, causing, impact, impacts, impacted,
#                effect, effects
#
# Why: DPMO is rate-normalized signal, not causal proof. Causal language
# in dashboard output would misrepresent statistical correlation as
# causation — the exact failure mode the DPMO_DISCLOSURE constant guards.
#
# Exit: 0 = clean, 1 = banned token found
#
# Usage: bash scripts/lint-banned-causal-tokens.sh [target-dirs...]
# Default target dirs: components/ app/ lib/

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Directories to scan (override via positional args)
if [ "$#" -gt 0 ]; then
  SCAN_DIRS=("$@")
else
  SCAN_DIRS=(
    "${REPO_ROOT}/components"
    "${REPO_ROOT}/app"
    "${REPO_ROOT}/lib"
  )
fi

# Banned causal tokens (word-boundary matched, case-insensitive)
BANNED_PATTERN='\b(caused|causes|causing|impact|impacts|impacted|effect|effects)\b'

FOUND=0
HITS=""

for dir in "${SCAN_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    printf 'SKIP: %s (not a directory)\n' "$dir" >&2
    continue
  fi
  while IFS= read -r -d '' file; do
    matches=$(grep -inE "$BANNED_PATTERN" "$file" 2>/dev/null) || true
    if [ -n "$matches" ]; then
      FOUND=$((FOUND + 1))
      while IFS= read -r line; do
        HITS="${HITS}${file}: ${line}"$'\n'
      done <<< "$matches"
    fi
  done < <(find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" \) -print0 2>/dev/null)
done

if [ "$FOUND" -gt 0 ]; then
  printf 'FAIL [DC8]: Banned causal token(s) found in dashboard output templates.\n' >&2
  printf '%s' "$HITS" >&2
  printf '\nFix: Remove causal language from dashboard output. DPMO is rate-normalized\n' >&2
  printf 'signal, not causal proof. Use descriptive language instead:\n' >&2
  printf '  "impact" → "count", "rate", "measure"\n' >&2
  printf '  "caused" → "associated with", "observed when"\n' >&2
  printf '  "effect" → "pattern", "signal"\n' >&2
  exit 1
fi

printf 'PASS [DC8]: No banned causal tokens found in %d scanned directories.\n' "${#SCAN_DIRS[@]}"
exit 0
