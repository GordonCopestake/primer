export type SchemaVersion = 1 | 2;

export type Locale = string;

export type LearnerId = string;

export type ModuleId = string;

export type ConceptId = string;

export type ObjectiveId = string;

export type LessonId = string;

export type SceneId = string;

export interface LearnerProfile {
  learnerId: LearnerId;
  locale: Locale;
  interests: string[];
  avatarSeed: string | null;
  preferredModalities: Modality[];
  createdAt: string;
  lastActiveAt: string;
}

export type Modality = 'audio' | 'visual' | 'interactive' | 'text';

export interface ModuleSelection {
  selectedModuleId: ModuleId | null;
  availableModuleIds: ModuleId[];
  selectedAt: string | null;
}

export type DiagnosticStatus = 'not-started' | 'in-progress' | 'complete';

export type ReadinessLevel = 'unknown' | 'not-ready' | 'ready' | 'advanced';

export type ConceptStatus = 
  | 'locked' 
  | 'available' 
  | 'in-progress' 
  | 'mastered' 
  | 'review-due' 
  | 'recommended-next';

export interface MasteryRecord {
  score: number;
  status: ConceptStatus;
  attempts: number;
  lastPracticedAt: string | null;
  reviewDueAt: string | null;
}

export type EvidenceType = 
  | 'mastery-evidence'
  | 'diagnostic-step-complete'
  | 'diagnostic-complete'
  | 'review-complete';

export interface EvidenceRecord {
  conceptId: ConceptId;
  type: EvidenceType;
  delta: number;
  recordedAt: string;
  context?: Record<string, unknown>;
}

export interface ReviewScheduleEntry {
  conceptId: ConceptId;
  dueAt: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
}

export type ActivityType =
  | 'lesson-start'
  | 'lesson-complete'
  | 'assessment-submit'
  | 'mastery-evidence'
  | 'diagnostic-start'
  | 'diagnostic-complete'
  | 'review-start'
  | 'module-select';

export interface ActivityRecord {
  type: ActivityType;
  conceptId?: ConceptId;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Goal {
  id: string;
  conceptId?: ConceptId;
  description: string;
  targetDate?: string;
  completed: boolean;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  conceptIds: ConceptId[];
  description: string;
  achievedAt?: string;
}

export interface LessonRecord {
  lessonId: LessonId;
  conceptId: ConceptId;
  startedAt: string;
  completedAt?: string;
  attempts: number;
  bestScore: number;
}

export interface AttemptRecord {
  conceptId: ConceptId;
  lessonId?: LessonId;
  input: string;
  correct: boolean;
  reason: ValidationReason;
  timestamp: string;
}

export interface MisconceptionTag {
  tag: string;
  occurrences: number;
  lastObservedAt: string;
}

export interface PedagogicalState {
  diagnosticStatus: DiagnosticStatus;
  diagnosticStep: number;
  readiness: ReadinessLevel;

  currentConceptId: ConceptId | null;
  currentLessonId: LessonId | null;
  currentObjectiveId: ObjectiveId | null;
  recommendedConceptId: ConceptId | null;

  masteryByConcept: Record<ConceptId, MasteryRecord>;
  misconceptionsByConcept: Record<ConceptId, MisconceptionTag[]>;
  evidenceLog: EvidenceRecord[];
  reviewSchedule: ReviewScheduleEntry[];
  recentActivity: ActivityRecord[];

  lessonRecords: Record<LessonId, LessonRecord>;
  attemptLog: AttemptRecord[];

  goals: Goal[];
  milestones: Milestone[];
}

export type ValidationReason = 
  | 'empty' 
  | 'syntax' 
  | 'numeric' 
  | 'expression' 
  | 'equation' 
  | 'value' 
  | 'mismatch';

export interface ValidationResult {
  correct: boolean;
  reason: ValidationReason;
  detail?: string;
  metadata?: Record<string, unknown>;
}

export interface Role {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface RuntimeSession {
  activeSceneId: SceneId | null;
  lastScene: SceneBlueprint | null;
  recentTurns: Role[];
  runningSummary: string | null;
}

export interface SceneBlueprint {
  version: number;
  scene: {
    id: SceneId;
    kind: SceneKind;
    objectiveId?: ObjectiveId;
    transition?: string;
    tone?: string;
  };
  narration: {
    text: string;
    maxChars: number;
    estDurationMs: number;
    bargeInAllowed: boolean;
  };
  visualIntent?: {
    recipeId?: string;
  };
  interaction: InteractionConfig;
  evidence?: {
    observedSkill?: string;
    confidenceHint?: number;
  };
}

export type SceneKind = 
  | 'setup' 
  | 'module-selection' 
  | 'assessment' 
  | 'lesson' 
  | 'concept-detail' 
  | 'fallback';

export type InteractionType = 
  | 'math-input' 
  | 'trace-symbol' 
  | 'read-respond' 
  | 'choice' 
  | 'repeat-sound';

export interface InteractionConfig {
  type: InteractionType;
  prompt?: string;
  expressionPrompt?: string;
  expectedExpression?: string;
  expectedKeywords?: string[];
  target?: string;
  options?: AssessmentOption[];
}

export interface AssessmentOption {
  id: string;
  label: string;
  correct: boolean;
}

export interface ConsentAndSettings {
  cloudEnabled: boolean;
  cloudImageEnabled: boolean;
  cloudVisionEnabled: boolean;
  telemetryEnabled: boolean;

  adminPinEnabled: boolean;
  adminPinHash: string | null;
  adminUnlocked: boolean;

  captionsEnabled: boolean;
  soundEnabled: boolean;

  storagePersistenceGranted: 'unknown' | 'granted' | 'denied';
}

export interface ProviderConfig {
  providerName: string;
  modelName: string;
  endpointUrl: string;
  apiKey: string;
  configuredAt: string | null;
}

export type CapabilityTier = 'minimal' | 'standard-local' | 'accelerated-local';

export interface Capabilities {
  tier: CapabilityTier;
  webgpu: boolean;
  opfs: boolean;
  indexedDb: boolean;
  localTTS: boolean;
  localSTT: boolean;
  microphone: boolean;
}

export type AssetKind = 
  | 'built-in-shell-assets' 
  | 'fallback-audio' 
  | 'lesson-assets' 
  | 'local-model-pack';

export type StorageBackend = 'bundle' | 'idb' | 'opfs' | 'cache';

export interface AssetRecord {
  id: string;
  kind: AssetKind;
  storage: StorageBackend;
  version: string;
  bytes: number;
  essential: boolean;
  installed: boolean;
  generated: boolean;
  label: string;
  checksum: string;
  lastAccess: string;
}

export interface AssetIndex {
  manifestVersion: number;
  byId: Record<string, AssetRecord>;
  quotaEstimate: number | null;
}

export interface ExportMetadata {
  lastExportedAt: string | null;
  lastImportedAt: string | null;
  exportFormatVersion: number;
}

export interface LearnerState {
  schemaVersion: SchemaVersion;
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

export interface Concept {
  id: ConceptId;
  label: string;
  description: string;
  prerequisites: ConceptId[];
  dependents: ConceptId[];
  masteryRule: string;
  masteryThreshold: number;
  misconceptionTags: string[];
  estimatedMinutes: number;
  optional: boolean;
}

export interface SubjectPack {
  id: ModuleId;
  version: string;
  metadata: {
    title: string;
    slug: string;
    subject: string;
    focus: string;
    description: string;
    language: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedHours: number;
    prerequisites: ModuleId[];
  };
  conceptGraph: Concept[];
}
