# Privacy.md

## Default privacy posture

- No cloud accounts.
- No cloud persistence by default.
- No application-side cloud logs containing learner or parent content.
- Learner and parent data remains local to the device unless explicitly exported or sent through fallback inference.

## Local data lifecycle

- Retention is local-by-default and controlled from on-device parent area.
- Parent can review and delete local transcripts, safety history, and artifacts.
- Deletion actions remove local records/artifacts according to platform storage behavior.

## Backup portability

- Backup is optional and manual via local export/import bundles.
- Export files are created locally and remain under parent control.
- Import restores data onto the target device locally.

## Cloud fallback disclosure

- Some tasks may require optional cloud inference fallback through the stateless relay.
- Primer relay does not persist learner transcripts, accounts, or files as product data.
- Third-party model providers may still apply their own logging/retention policies unless a specific zero-retention agreement/configuration is in place.
- Product UX must disclose this distinction clearly wherever cloud fallback can be enabled.
