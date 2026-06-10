#!/usr/bin/env bash
# DC8 smoke test — proves lint-banned-causal-tokens.sh is wired and detects violations.
#
# Two assertions:
#   1. Lint PASSES on clean dashboard dirs (components/, app/, lib/)
#   2. Lint FAILS on the synthetic fixture (tests/fixtures/banned-token-fixture.tsx)
#
# DC8 requires BOTH to pass — proving the lint is active AND sensitive.
#
# Usage: bash tests/dc8-banned-token-lint.sh
# Exit: 0 = both assertions pass, 1 = one or more fail

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LINT="${REPO_ROOT}/scripts/lint-banned-causal-tokens.sh"
FIXTURE_DIR="${REPO_ROOT}/tests/fixtures"

PASS=0
FAIL=0

assert_pass() { PASS=$((PASS + 1)); printf '  PASS %s\n' "$1"; }
assert_fail() { FAIL=$((FAIL + 1)); printf '  FAIL %s\n' "$1"; }

printf '\n=== DC8: Banned Causal Token Lint ===\n'

# Assertion 1: clean dirs produce exit 0
OUT=$(bash "$LINT" "${REPO_ROOT}/components" "${REPO_ROOT}/app" "${REPO_ROOT}/lib" 2>&1)
RC=$?
if [ "$RC" = "0" ]; then
  assert_pass "(1) lint passes on clean dashboard dirs"
else
  assert_fail "(1) lint should pass on clean dirs — got exit $RC: $OUT"
fi

# Assertion 2: fixture dir produces exit 1
OUT=$(bash "$LINT" "$FIXTURE_DIR" 2>&1)
RC=$?
if [ "$RC" = "1" ]; then
  assert_pass "(2) lint fails on synthetic fixture containing 'caused'"
else
  assert_fail "(2) lint should fail on fixture — got exit $RC: $OUT"
fi

printf '\n=== Summary ===\nPASS: %d\nFAIL: %d\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
