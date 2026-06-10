// DC8 synthetic test fixture — contains a banned causal token intentionally.
// This file is ONLY used to prove lint-banned-causal-tokens.sh detects violations.
// DO NOT import or render this component.
//
// The token below should trigger the lint when this fixture is passed as a target.

export function BannedTokenFixture() {
  return (
    <p>
      This rule caused a reduction in violations.
    </p>
  );
}
