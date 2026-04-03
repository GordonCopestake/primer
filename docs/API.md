# API.md

## Approach

Primer is local-first. Most product behavior runs in-app with local data and safety validation. Network API usage is optional and limited to a stateless inference relay.

## Local interfaces (primary)

Primary boundaries are local TypeScript interfaces validated with Zod:

- `parentGate/*`
- `learnerProfiles/*`
- `learnerState/*`
- `curriculum/*`
- `sessions/*`
- `stories/*`
- `homework/*`
- `safety/*`
- `privacy/*`

These modules read/write only local storage.

## Optional relay endpoints (secondary)

When local inference cannot satisfy a request, app code may call a relay endpoint:

- `POST /inference/complete`

### Relay contract requirements

- Request payload is pre-validated and policy-checked before relay call.
- Response payload must match structured output schemas.
- Relay may include provider/model metadata needed for debugging.
- Relay must not persist learner identifiers, transcripts, homework files, or analytics content.

## Explicit non-goals for relay

- No user accounts
- No household auth flows
- No child profile storage
- No session transcript persistence
- No object/file storage
- No long-lived application-side cloud logs containing learner content
