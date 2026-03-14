#!/usr/bin/env bash
# Toggle the test expectation in tests/test_crud.py between a passing state (200) and a failing state (201).
#
# Usage:
#   ./scripts/toggle_test_failure.sh        # toggles between passing and failing
#   ./scripts/toggle_test_failure.sh --pass # ensure tests pass
#   ./scripts/toggle_test_failure.sh --fail # ensure tests fail

set -euo pipefail

TEST_FILE="tests/test_crud.py"
PASS_LINE='    assert resp.status_code == 200'
FAIL_LINE='    assert resp.status_code == 201'

if [[ ! -f "$TEST_FILE" ]]; then
  echo "ERROR: $TEST_FILE not found"
  exit 1
fi

mode="toggle"
if [[ "${1:-}" == "--pass" ]]; then
  mode="pass"
elif [[ "${1:-}" == "--fail" ]]; then
  mode="fail"
elif [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Usage: ./scripts/toggle_test_failure.sh [--pass|--fail]

--pass   Make the test suite pass (assert 200)
--fail   Make the test suite fail (assert 201)
(no arg) Toggle between pass/fail
EOF
  exit 0
fi

current=$(grep -n "assert resp.status_code" "$TEST_FILE" | head -n1 || true)
if [[ -z "$current" ]]; then
  echo "ERROR: Could not find the assertion line in $TEST_FILE"
  exit 1
fi

if [[ "$mode" == "toggle" ]]; then
  if grep -qF "$PASS_LINE" "$TEST_FILE"; then
    mode="fail"
  else
    mode="pass"
  fi
fi

if [[ "$mode" == "pass" ]]; then
  echo "Setting test to PASS (assert 200)"
  sed -i "s#${FAIL_LINE}#${PASS_LINE}#" "$TEST_FILE"
elif [[ "$mode" == "fail" ]]; then
  echo "Setting test to FAIL (assert 201)"
  sed -i "s#${PASS_LINE}#${FAIL_LINE}#" "$TEST_FILE"
fi

# print the changed line for confirmation
grep -n "assert resp.status_code" "$TEST_FILE" | head -n1
