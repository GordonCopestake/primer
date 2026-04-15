# Primer Architecture Documentation

## Schema Documentation

### Validator Contract

The validator is responsible for determining whether a learner's response to an assessment item is correct.

```typescript
interface ValidationPlugin {
  validate(input: string, expected: string, options?: ValidationOptions): ValidationResult;
}

interface ValidationResult {
  correct: boolean;
  reason: ValidationReason;
  detail?: string;
}

type ValidationReason = "empty" | "syntax" | "numeric" | "expression" | "equation" | "value" | "mismatch";
```

### Learner State Schema

```typescript
interface LearnerState {
  schemaVersion: number;
  learnerProfile: LearnerProfile;
  moduleSelection: ModuleSelection;
  pedagogicalState: PedagogicalState;
  runtimeSession: RuntimeSession;
  consentAndSettings: ConsentAndSettings;
  providerConfig: ProviderConfig;
  capabilities: Capabilities;
  assetIndex: AssetIndex;
  exportMetadata: ExportMetadata;
}
```

### Subject Pack Schema

```typescript
interface SubjectPack {
  id: string;
  version: string;
  metadata: PackMetadata;
  validator: ValidatorConfig;
  conceptGraph: Concept[];
  diagnosticItems: DiagnosticItem[];
  lessons: Lesson[];
  assessmentItems: AssessmentItem[];
}
```

## Adapter Interfaces

See `packages/core/src/interfaces.js` for full adapter interface definitions:
- AI Provider Adapter
- Storage Adapter
- Telemetry Sink
- Validation Plugin
- UI Component Registry
