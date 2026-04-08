# Telemetry Schema

Primer models telemetry as optional local state plus optional sink delivery. Telemetry is off by default.

The relevant schema surfaces live in:
- [`packages/schemas/src/state.js`](/home/gordon/source/primer/packages/schemas/src/state.js)
- [`packages/core/src/contracts.js`](/home/gordon/source/primer/packages/core/src/contracts.js)

## Consent Surface

Top-level telemetry consent lives in `consentAndSettings`.

Current fields:
- `telemetryEnabled`
- `telemetryPreferences.validatorMismatchEnabled`
- `telemetryPreferences.crashReportsEnabled`
- `telemetryPreferences.reviewedTraceDonationEnabled`

Both the master toggle and the per-class toggle have to allow an event before local recording or sink delivery should happen.

## Local Telemetry State

Current telemetry state fields:
- `eventLog`
- `pendingTraceDonation`
- `lastCrashAt`

## Event Record

Telemetry events are normalized through `createTelemetryEventRecord(...)`.

Current fields:
- `eventId`
- `category`
- `summary`
- `details`
- `requiresReview`
- `recordedAt`

Current event categories used by the product:
- `validator-mismatch`
- `crash-report`
- `reviewed-trace-donation`

## Trace Donation Draft

Trace donation is staged as a review draft before donation.

Current draft fields:
- `draftId`
- `sceneId`
- `objectiveId`
- `summary`
- `reviewStatus`
- `preparedAt`

`pendingTraceDonation` stores this draft locally until the user donates it or clears it.

## Product Rules

The current telemetry implementation follows these rules:
- telemetry is off by default
- telemetry can be revoked
- reviewed trace donation is never automatic
- crash and validator events stay bounded and inspectable
- telemetry is optional to the runtime and flows through the `telemetrySink` adapter contract
