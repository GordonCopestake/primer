# Validator Contract

Primer's current deterministic math validator lives in [`packages/core/src/mathValidation.js`](/home/gordon/source/primer/packages/core/src/mathValidation.js) and is exposed through the `validationPlugin` contract defined in [`packages/core/src/contracts.js`](/home/gordon/source/primer/packages/core/src/contracts.js).

## Required Interface

A validation plugin must provide:
- `validateResponse(input, expectedResponse, context?)`
- `classifyError(input, expectedResponse)`

The current shared plugin is exported as `MATH_VALIDATION_PLUGIN`.

## Validation Result Shape

`validateResponse(...)` returns a bounded object with:
- `correct`
- `reason`
- `mode`
- `feedback`
- `details`

The runtime uses this to separate correctness, learner-facing feedback, and stable error classification.

## Current Modes

The shared algebra validator currently distinguishes:
- `numeric`
- `expression`

These modes are selected based on whether the comparable inputs are pure numeric expressions or symbolic algebraic expressions.

## Current Reasons

The current deterministic validator can report:
- `numeric`
- `expression`
- `syntax`
- `equation-form`
- `unsupported-variable`
- `divide-by-zero`
- `conceptual`

These reasons let the tutoring loop distinguish malformed input from mathematically structured but incorrect input.

## Bounded Grammar

The current parser supports:
- numbers
- the authored variable `x`
- parentheses
- unary `+` and `-`
- binary `+`, `-`, `*`, `/`
- optional equation form with a single `=`

Unsupported variables and unsafe syntax are rejected deterministically.

## Equivalence Policy

The validator does not execute arbitrary code. It parses the learner and expected expressions into a bounded AST and compares them numerically across a fixed set of checkpoints for symbolic equivalence.

This means the validator is:
- local
- deterministic
- bounded to the authored algebra MVP

## Contract Expectations

Any replacement validation plugin should preserve the same product posture:
- deterministic local checking
- stable classification for tutoring and telemetry
- no unbounded code execution
- compatibility with authored lesson and assessment answer contracts
