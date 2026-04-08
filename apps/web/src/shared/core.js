import { SCHEMA_VERSION, createStateShape, validateSceneBlueprint } from "./schemas.js";

export const ALGEBRA_FOUNDATIONS_MODULE_ID = "algebra-foundations";

export const ALGEBRA_FOUNDATIONS_MODULE = {
  id: ALGEBRA_FOUNDATIONS_MODULE_ID,
  title: "Algebra Foundations",
  slug: "algebra-foundations",
  subject: "mathematics",
  focus: "linear equations",
  description: "A bounded algebra module covering variables, expressions, and linear equations.",
  conceptGraph: [
    {
      id: "variables-and-expressions",
      label: "Variables and expressions",
      description: "Read and write simple algebraic expressions with variables.",
      prerequisites: [],
      masteryRule: "Solve two short translation tasks and explain what a variable stands for.",
      misconceptionTags: ["variable-as-label", "operator-order"],
    },
    {
      id: "evaluate-expressions",
      label: "Evaluate expressions",
      description: "Substitute values and evaluate algebraic expressions correctly.",
      prerequisites: ["variables-and-expressions"],
      masteryRule: "Correctly substitute and simplify three expressions.",
      misconceptionTags: ["missed-substitution", "operator-order"],
    },
    {
      id: "order-of-operations",
      label: "Order of operations",
      description: "Apply the correct operation order in arithmetic and algebraic expressions.",
      prerequisites: ["variables-and-expressions"],
      masteryRule: "Apply operation order correctly in three mixed examples.",
      misconceptionTags: ["left-to-right-only", "bracket-ignored"],
    },
    {
      id: "like-terms",
      label: "Like terms",
      description: "Recognize and combine like terms in simple expressions.",
      prerequisites: ["evaluate-expressions", "order-of-operations"],
      masteryRule: "Combine like terms in three expressions without changing unlike terms.",
      misconceptionTags: ["term-merging", "coefficient-sign"],
    },
    {
      id: "inverse-operations",
      label: "Inverse operations",
      description: "Use inverse operations to undo arithmetic changes to a variable.",
      prerequisites: ["evaluate-expressions"],
      masteryRule: "Name and apply the inverse operation in three cases.",
      misconceptionTags: ["same-operation-twice", "inverse-order"],
    },
    {
      id: "one-step-addition-equations",
      label: "One-step addition equations",
      description: "Solve equations of the form x + a = b.",
      prerequisites: ["inverse-operations"],
      masteryRule: "Solve and check three one-step addition equations.",
      misconceptionTags: ["move-without-inverse", "unchecked-solution"],
    },
    {
      id: "one-step-subtraction-equations",
      label: "One-step subtraction equations",
      description: "Solve equations of the form x - a = b.",
      prerequisites: ["inverse-operations"],
      masteryRule: "Solve and check three one-step subtraction equations.",
      misconceptionTags: ["sign-flip", "unchecked-solution"],
    },
    {
      id: "one-step-multiplication-equations",
      label: "One-step multiplication equations",
      description: "Solve equations of the form ax = b.",
      prerequisites: ["inverse-operations"],
      masteryRule: "Solve and check three one-step multiplication equations.",
      misconceptionTags: ["divide-sign-error", "unchecked-solution"],
    },
    {
      id: "one-step-division-equations",
      label: "One-step division equations",
      description: "Solve equations of the form x / a = b.",
      prerequisites: ["inverse-operations"],
      masteryRule: "Solve and check three one-step division equations.",
      misconceptionTags: ["multiply-sign-error", "unchecked-solution"],
    },
    {
      id: "two-step-equations",
      label: "Two-step equations",
      description: "Solve linear equations that need two inverse-operation steps.",
      prerequisites: [
        "one-step-addition-equations",
        "one-step-subtraction-equations",
        "one-step-multiplication-equations",
        "one-step-division-equations",
      ],
      masteryRule: "Solve and check four two-step equations.",
      misconceptionTags: ["wrong-first-step", "sign-flip"],
    },
    {
      id: "distributive-property",
      label: "Distributive property",
      description: "Expand simple bracketed expressions correctly.",
      prerequisites: ["like-terms"],
      masteryRule: "Expand three expressions with correct sign handling.",
      misconceptionTags: ["outer-term-only", "sign-distribution"],
    },
    {
      id: "equations-with-like-terms",
      label: "Equations with like terms",
      description: "Simplify then solve equations that require combining like terms.",
      prerequisites: ["two-step-equations", "like-terms"],
      masteryRule: "Simplify and solve three equations with like terms.",
      misconceptionTags: ["combine-after-solving", "coefficient-loss"],
    },
    {
      id: "equations-with-distribution",
      label: "Equations with distribution",
      description: "Use distribution then solve a linear equation.",
      prerequisites: ["two-step-equations", "distributive-property"],
      masteryRule: "Distribute and solve three equations correctly.",
      misconceptionTags: ["distribution-sign", "step-order"],
    },
    {
      id: "variables-on-both-sides",
      label: "Variables on both sides",
      description: "Collect variable terms and constants to solve equations with variables on both sides.",
      prerequisites: ["equations-with-like-terms", "equations-with-distribution"],
      masteryRule: "Solve three equations with variables on both sides and justify the move.",
      misconceptionTags: ["subtract-wrong-side", "coefficient-loss"],
    },
    {
      id: "fraction-equations",
      label: "Fraction equations",
      description: "Solve simple linear equations involving fractions.",
      prerequisites: ["variables-on-both-sides"],
      masteryRule: "Solve two fraction equations and explain the clearing step.",
      misconceptionTags: ["partial-clearing", "denominator-drop"],
    },
    {
      id: "decimal-equations",
      label: "Decimal equations",
      description: "Solve linear equations involving decimals accurately.",
      prerequisites: ["variables-on-both-sides"],
      masteryRule: "Solve two decimal equations with accurate arithmetic.",
      misconceptionTags: ["decimal-place-shift", "round-too-early"],
    },
    {
      id: "solution-checking",
      label: "Check a solution",
      description: "Substitute a proposed solution back into the original equation.",
      prerequisites: ["two-step-equations"],
      masteryRule: "Check three solutions and identify one invalid result.",
      misconceptionTags: ["check-simplified-form-only", "arithmetic-check-error"],
    },
    {
      id: "inequalities-intro",
      label: "One-variable inequalities",
      description: "Solve and interpret simple one-variable inequalities.",
      prerequisites: ["two-step-equations"],
      masteryRule: "Solve three inequalities and describe the solution set.",
      misconceptionTags: ["treat-like-equation", "reverse-sign-missed"],
    },
    {
      id: "translate-word-problems",
      label: "Translate word problems",
      description: "Turn short verbal descriptions into algebraic equations.",
      prerequisites: ["variables-and-expressions", "two-step-equations"],
      masteryRule: "Translate three short prompts into valid equations.",
      misconceptionTags: ["unknown-not-defined", "operation-word-confusion"],
    },
    {
      id: "solve-word-problems",
      label: "Solve word problems",
      description: "Solve bounded word problems with linear equations and interpret the answer.",
      prerequisites: ["translate-word-problems", "solution-checking"],
      masteryRule: "Solve two short word problems and interpret the answer in context.",
      misconceptionTags: ["equation-right-answer-wrong", "unit-drop"],
    },
  ],
};

export const ALGEBRA_DIAGNOSTIC_ITEMS = [
  {
    id: "diagnostic.variables",
    conceptId: "variables-and-expressions",
    prompt: "What does the variable mean in x + 3 = 10?",
    inputType: "short-explanation",
  },
  {
    id: "diagnostic.substitution",
    conceptId: "evaluate-expressions",
    prompt: "Evaluate 2x + 1 when x = 4.",
    inputType: "numeric",
  },
  {
    id: "diagnostic.one-step",
    conceptId: "one-step-addition-equations",
    prompt: "Solve x + 5 = 12.",
    inputType: "expression",
  },
  {
    id: "diagnostic.two-step",
    conceptId: "two-step-equations",
    prompt: "Solve 2x + 3 = 11.",
    inputType: "expression",
  },
];

export const ALGEBRA_LESSONS = [
  {
    id: "lesson.variables-and-expressions",
    conceptId: "variables-and-expressions",
    lessonType: "explain-and-try",
    title: "What a variable means",
    objective: "Introduce variables as placeholders and read simple expressions.",
    workedExample: "If x means 4, then x + 3 means 7.",
    prompt: "Write x + 2 for a number that is two more than x.",
    hint: "Name the unknown first, then describe how the expression changes it.",
    remediation: "A variable stands for a value that can change. Read x + 2 as 'two more than x', not as a single joined symbol.",
    successFeedback: "You treated the variable like a number placeholder, which is exactly the right start.",
  },
  {
    id: "lesson.evaluate-expressions",
    conceptId: "evaluate-expressions",
    lessonType: "worked-example",
    title: "Substitute and evaluate",
    objective: "Replace a variable with a value and simplify.",
    workedExample: "When x = 4, 2x + 1 = 9.",
    prompt: "Evaluate 3x - 2 when x = 5.",
    hint: "Substitute the given value everywhere the variable appears before simplifying.",
    remediation: "Write the value in place of x first: 3(5) - 2. Then simplify in order instead of mixing substitution and arithmetic together.",
    successFeedback: "The substitution and simplification both held together cleanly.",
  },
  {
    id: "lesson.one-step-equations",
    conceptId: "one-step-addition-equations",
    lessonType: "guided-practice",
    title: "Undo addition",
    objective: "Solve x + a = b using inverse operations.",
    workedExample: "x + 5 = 12 becomes x = 7.",
    prompt: "Solve x + 4 = 11.",
    hint: "Ask which operation is happening to x, then undo that exact operation on both sides.",
    remediation: "In x + 4 = 11, the variable has 4 added to it. Subtract 4 from both sides before checking the result in the original equation.",
    successFeedback: "You used the inverse operation and isolated the variable correctly.",
  },
  {
    id: "lesson.two-step-equations",
    conceptId: "two-step-equations",
    lessonType: "guided-practice",
    title: "Two-step equations",
    objective: "Solve equations that need two inverse operations.",
    workedExample: "2x + 3 = 11 becomes 2x = 8, then x = 4.",
    prompt: "Solve 3x - 2 = 13.",
    hint: "Undo the constant first, then undo the coefficient.",
    remediation: "Treat 3x - 2 = 13 as two operations on x. Add 2 first to isolate 3x, then divide by 3. Reversing the order usually causes the mistake here.",
    successFeedback: "You reversed the operations in a stable order and arrived at the correct value.",
  },
  {
    id: "lesson.like-terms",
    conceptId: "like-terms",
    lessonType: "guided-practice",
    title: "Combine like terms",
    objective: "Group terms with the same variable part and combine only their coefficients.",
    workedExample: "3x + 2x - 4 becomes 5x - 4 because only the x-terms combine.",
    prompt: "Simplify 4x + 3x - 2.",
    hint: "Look for matching variable parts before you add or subtract coefficients.",
    remediation: "Only like terms combine. 4x and 3x can become 7x, but constants stay separate until the end.",
    successFeedback: "You combined the matching terms without changing the unlike ones.",
  },
  {
    id: "lesson.inverse-operations",
    conceptId: "inverse-operations",
    lessonType: "explain-and-try",
    title: "Use inverse operations",
    objective: "Recognize which operation undoes the one attached to the variable.",
    workedExample: "If 6 is added to x, subtracting 6 undoes that change.",
    prompt: "What inverse operation undoes multiplying by 5?",
    hint: "Think about how to get back to the original value.",
    remediation: "Inverse operations reverse each other: addition with subtraction, multiplication with division.",
    successFeedback: "You matched the operation with its inverse correctly.",
  },
  {
    id: "lesson.equations-with-distribution",
    conceptId: "equations-with-distribution",
    lessonType: "guided-practice",
    title: "Distribute, then solve",
    objective: "Expand the bracket correctly before applying equation-solving steps.",
    workedExample: "2(x + 3) = 14 becomes 2x + 6 = 14, then 2x = 8, then x = 4.",
    prompt: "Solve 3(x + 2) = 15.",
    hint: "Multiply every term inside the bracket before isolating the variable.",
    remediation: "Distribution affects each term in the bracket. After expanding, solve the new linear equation step by step.",
    successFeedback: "You distributed across the bracket and then solved the equation in order.",
  },
  {
    id: "lesson.solution-checking",
    conceptId: "solution-checking",
    lessonType: "worked-example",
    title: "Check by substitution",
    objective: "Verify a proposed solution by placing it back into the original equation.",
    workedExample: "If x = 4 for 2x + 3 = 11, then 2(4) + 3 = 11, so the solution works.",
    prompt: "Does x = 3 satisfy x + 5 = 8?",
    hint: "Substitute the value into the original equation, not the simplified one.",
    remediation: "Checking means replacing the variable in the original equation and seeing whether both sides still match.",
    successFeedback: "You used substitution to confirm the equation stayed balanced.",
  },
  {
    id: "lesson.translate-word-problems",
    conceptId: "translate-word-problems",
    lessonType: "explain-and-try",
    title: "Translate words into equations",
    objective: "Turn short verbal statements into a variable equation before solving.",
    workedExample: "\"Five more than a number is 12\" becomes x + 5 = 12.",
    prompt: "Write an equation for: seven less than a number is 9.",
    hint: "Name the unknown, then map the operation words into algebra symbols.",
    remediation: "Choose a variable for the unknown first. Then translate phrases like 'more than' or 'less than' carefully into operations.",
    successFeedback: "You translated the language into a valid algebra equation.",
  },
  {
    id: "lesson.solve-word-problems",
    conceptId: "solve-word-problems",
    lessonType: "guided-practice",
    title: "Solve and interpret",
    objective: "Solve the equation and then state what the answer means in the problem context.",
    workedExample: "If a ticket costs x pounds and two tickets cost 18, then 2x = 18 so x = 9 pounds.",
    prompt: "A number plus 6 is 15. What is the number?",
    hint: "Solve the equation first, then restate the answer in words.",
    remediation: "Keep the context attached to the algebra. After solving, check that your answer still makes sense in the original sentence.",
    successFeedback: "You solved the equation and linked the result back to the situation.",
  },
];

export const ALGEBRA_ASSESSMENT_ITEMS = ALGEBRA_DIAGNOSTIC_ITEMS.map((item, index) => ({
  ...item,
  kind: index < 2 ? "readiness" : "placement",
  rubric: "Use a bounded response that can be checked deterministically.",
}));

export const ALGEBRA_ATTEMPT_TEMPLATE = {
  result: "pending",
  evidence: [],
  misconceptionTags: [],
  feedback: "",
};

export const getAlgebraConcept = (conceptId) =>
  ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.find((concept) => concept.id === conceptId) ?? null;

export const getUnlockedConcepts = (masteryByConcept = {}) =>
  ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.filter((concept) =>
    concept.prerequisites.every((prerequisiteId) => (masteryByConcept[prerequisiteId]?.score ?? 0) >= 1),
  );

export const getRecommendedConceptId = (masteryByConcept = {}) => {
  const concept =
    getUnlockedConcepts(masteryByConcept).find((item) => (masteryByConcept[item.id]?.score ?? 0) < 1) ??
    ALGEBRA_FOUNDATIONS_MODULE.conceptGraph[0];

  return concept?.id ?? null;
};

export const getLessonForConcept = (conceptId) =>
  ALGEBRA_LESSONS.find((lesson) => lesson.conceptId === conceptId) ?? null;

const hasIndexedDb = (env) => Boolean(env?.indexedDB);
const hasOpfs = (env) => Boolean(env?.navigator?.storage?.getDirectory);
const hasSpeechSynthesis = (env) => Boolean(env?.speechSynthesis);
const hasSpeechRecognition = (env) => Boolean(env?.SpeechRecognition || env?.webkitSpeechRecognition);
const hasMicrophone = (env) => Boolean(env?.navigator?.mediaDevices?.getUserMedia);
const hasWebGpu = (env) => Boolean(env?.navigator?.gpu);

export const detectCapabilities = (env) => {
  const indexedDb = hasIndexedDb(env);
  const opfs = hasOpfs(env);
  const localTTS = hasSpeechSynthesis(env);
  const localSTT = hasSpeechRecognition(env);
  const microphone = hasMicrophone(env);
  const webgpu = hasWebGpu(env);

  let tier = "minimal";
  if (indexedDb && localTTS && (localSTT || microphone)) {
    tier = "standard-local";
  }
  if (tier === "standard-local" && webgpu && opfs) {
    tier = "accelerated-local";
  }

  return {
    tier,
    webgpu,
    opfs,
    indexedDb,
    localTTS,
    localSTT,
    microphone,
  };
};

const env = typeof process === "undefined" ? {} : process.env;

export const APP_CONFIG = {
  appMode: env.PRIMER_APP_MODE ?? "development",
  cloudMode: env.PRIMER_CLOUD_MODE ?? "required",
  relayBaseUrl: env.PRIMER_RELAY_BASE_URL ?? "",
  capabilityMode: env.PRIMER_CAPABILITY_MODE ?? "auto",
  features: {
    cloudDirector: env.FEATURE_CLOUD_DIRECTOR !== "false",
    cloudImage: env.FEATURE_CLOUD_IMAGE !== "false",
    cloudVision: env.FEATURE_CLOUD_VISION === "true",
    exportImport: env.FEATURE_EXPORT_IMPORT !== "false",
    encryptedExport: env.FEATURE_ENCRYPTED_EXPORT === "true",
    debugTools: env.FEATURE_DEBUG_TOOLS === "true",
  },
};

export const createDefaultState = (overrides = {}) => createStateShape(overrides);

const migrateLegacyPedagogicalState = (rawState) => ({
  diagnosticStatus: "not-started",
  diagnosticStep: 0,
  readiness: "unknown",
  currentConceptId: "variables-and-expressions",
  currentLessonId: null,
  currentObjectiveId: "diagnostic.variables",
  recommendedConceptId: "variables-and-expressions",
  masteryByConcept: {},
  misconceptionsByConcept: {},
  evidenceLog: [],
  reviewSchedule: [],
  recentActivity: [],
  lessonRecords: {},
  assessmentItems: {},
  attemptLog: [],
  goals: [],
  milestones: createDefaultState().pedagogicalState.milestones,
  ...(rawState?.pedagogicalState?.goals ? { goals: rawState.pedagogicalState.goals } : {}),
});

export const migrateState = (rawState) => {
  if (!rawState || typeof rawState !== "object") {
    return createDefaultState();
  }

  if (!rawState.schemaVersion || rawState.schemaVersion < SCHEMA_VERSION) {
    return createDefaultState({
      learnerProfile: {
        ...createDefaultState().learnerProfile,
        ...(rawState.learnerProfile ?? {}),
      },
      moduleSelection: {
        ...createDefaultState().moduleSelection,
        ...(rawState.moduleSelection ?? {}),
      },
      pedagogicalState: {
        ...migrateLegacyPedagogicalState(rawState),
      },
      runtimeSession: {
        ...createDefaultState().runtimeSession,
        recentTurns: rawState.runtimeSession?.recentTurns ?? [],
        runningSummary: rawState.runtimeSession?.runningSummary ?? null,
      },
      consentAndSettings: {
        ...createDefaultState().consentAndSettings,
        ...(rawState.consentAndSettings ?? {}),
      },
      providerConfig: {
        ...createDefaultState().providerConfig,
        ...(rawState.providerConfig ?? {}),
      },
      capabilities: {
        ...createDefaultState().capabilities,
        ...(rawState.capabilities ?? {}),
      },
      assetIndex: {
        ...createDefaultState().assetIndex,
        ...(rawState.assetIndex ?? {}),
      },
      exportMetadata: {
        ...createDefaultState().exportMetadata,
        ...(rawState.exportMetadata ?? {}),
      },
    });
  }

  return createDefaultState(rawState);
};

export const appendRecentTurn = (state, turn) => {
  const recentTurns = [...state.runtimeSession.recentTurns, turn].slice(-8);
  return createDefaultState({
    ...state,
    runtimeSession: {
      ...state.runtimeSession,
      recentTurns,
    },
  });
};

export const setActiveScene = (state, scene) =>
  createDefaultState({
    ...state,
    pedagogicalState: {
      ...state.pedagogicalState,
      currentObjectiveId: scene?.scene?.objectiveId ?? state.pedagogicalState.currentObjectiveId,
      ...(typeof scene?.scene?.objectiveId === "string" && scene.scene.objectiveId.startsWith("concept.")
        ? { currentConceptId: scene.scene.objectiveId.slice("concept.".length) }
        : {}),
    },
    runtimeSession: {
      ...state.runtimeSession,
      activeSceneId: scene?.scene?.id ?? null,
      lastScene: scene ?? null,
    },
  });

export const updateConsentSettings = (state, updates) =>
  createDefaultState({
    ...state,
    consentAndSettings: {
      ...state.consentAndSettings,
      ...updates,
    },
  });

const DIAGNOSTIC_SCENE_KINDS = ["assessment", "fallback"];
const LESSON_SCENE_KINDS = ["lesson", "practice", "review", "fallback"];
const DEFAULT_SESSION_PHASE = "explain";

const makeDiagnosticDecision = (state, item) => ({
  moduleId: ALGEBRA_FOUNDATIONS_MODULE.id,
  activeDomain: "mathematics",
  phase: "diagnostic",
  conceptId: item.conceptId,
  objectiveId: item.id,
  prompt: item.prompt,
  inputType: item.inputType,
  allowedSceneKinds: DIAGNOSTIC_SCENE_KINDS,
  allowedInteractionTypes:
    item.inputType === "multiple-choice"
      ? ["tap-choice", "none"]
      : item.inputType === "short-explanation"
        ? ["read-respond", "none"]
        : ["math-input", "none"],
  maxNarrationChars: 180,
  recommendedConceptId: state.pedagogicalState.recommendedConceptId,
});

const makeConceptDecision = (state, conceptId) => {
  const concept = ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.find((item) => item.id === conceptId);
  const lesson = getLessonForConcept(conceptId);
  const lessonRecord = state.pedagogicalState.lessonRecords?.[`lesson.${conceptId}`] ?? {};
  const sessionPhase = lessonRecord.sessionPhase ?? DEFAULT_SESSION_PHASE;

  return {
    moduleId: ALGEBRA_FOUNDATIONS_MODULE.id,
    activeDomain: "mathematics",
    phase: "tutoring",
    conceptId,
    objectiveId: `concept.${conceptId}`,
    prompt: concept?.description ?? "Continue with the next algebra concept.",
    lessonId: lesson?.id ?? `lesson.${conceptId}`,
    sessionPhase,
    lessonType: lesson?.lessonType ?? "guided-practice",
    allowedSceneKinds: LESSON_SCENE_KINDS,
    allowedInteractionTypes:
      sessionPhase === "learner-attempt" ? ["math-input", "tap-choice", "read-respond", "none"] : ["none"],
    maxNarrationChars: 220,
    recommendedConceptId: state.pedagogicalState.recommendedConceptId,
  };
};

const getDiagnosticItem = (step) =>
  ALGEBRA_DIAGNOSTIC_ITEMS[Math.max(0, Math.min(step, ALGEBRA_DIAGNOSTIC_ITEMS.length - 1))];

const appendUniqueRecentActivity = (state, activity) => {
  const nextActivity = [...state.pedagogicalState.recentActivity, activity].slice(-10);
  return {
    ...state.pedagogicalState,
    recentActivity: nextActivity,
  };
};

const updateMilestones = (state) => {
  const masteredConcepts = Object.values(state.pedagogicalState.masteryByConcept ?? {}).filter(
    (record) => (record?.score ?? 0) >= 1,
  ).length;
  const diagnosticComplete = state.pedagogicalState.diagnosticStatus === "complete";

  return createDefaultState({
    ...state,
    pedagogicalState: {
      ...state.pedagogicalState,
      milestones: [
        {
          id: "complete-diagnostic",
          label: "Complete the algebra diagnostic",
          status: diagnosticComplete ? "completed" : "active",
        },
        {
          id: "master-first-concept",
          label: "Master your first algebra concept",
          status: masteredConcepts >= 1 ? "completed" : diagnosticComplete ? "active" : "upcoming",
        },
      ],
    },
  });
};

const getDueReviewConceptId = (state) => {
  const now = Date.now();
  return (state.pedagogicalState.reviewSchedule ?? []).find((entry) => Date.parse(entry.reviewDueAt ?? "") <= now)?.conceptId ?? null;
};

const buildAttemptRecord = ({ conceptId, objectiveId, correct, input, inputType, phase }) => ({
  attemptId: `${objectiveId}:${Date.now()}`,
  conceptId,
  objectiveId,
  phase,
  inputType,
  learnerResponse: input,
  result: correct ? "correct" : "needs-review",
  recordedAt: new Date().toISOString(),
});

const deriveMisconceptionTags = (conceptId, correct) => {
  if (correct) {
    return [];
  }

  const concept = ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.find((item) => item.id === conceptId);
  return concept?.misconceptionTags?.slice(0, 1) ?? [];
};

export const nextCurriculumDecision = (state) => {
  if (state.pedagogicalState.diagnosticStatus !== "complete") {
    return makeDiagnosticDecision(state, getDiagnosticItem(state.pedagogicalState.diagnosticStep ?? 0));
  }

  const dueReviewConceptId = getDueReviewConceptId(state);
  const recommendedConceptId =
    dueReviewConceptId ??
    state.pedagogicalState.currentConceptId ??
    state.pedagogicalState.recommendedConceptId ??
    getRecommendedConceptId(state.pedagogicalState.masteryByConcept);

  return makeConceptDecision(state, recommendedConceptId);
};

export const recordAssessmentCompletion = (state, recommendedConceptId = "variables-and-expressions") =>
  updateMilestones(
    createDefaultState({
      ...state,
      pedagogicalState: {
        ...state.pedagogicalState,
        diagnosticStep: ALGEBRA_DIAGNOSTIC_ITEMS.length,
        diagnosticStatus: "complete",
        readiness: "ready",
        currentConceptId: recommendedConceptId,
        currentObjectiveId: `concept.${recommendedConceptId}`,
        recommendedConceptId,
        recentActivity: [
          ...state.pedagogicalState.recentActivity,
          {
            type: "diagnostic-complete",
            conceptId: recommendedConceptId,
            recordedAt: new Date().toISOString(),
          },
        ].slice(-10),
        goals:
          state.pedagogicalState.goals.length > 0
            ? state.pedagogicalState.goals
            : [
                {
                  id: "goal-start-algebra",
                  label: "Build confidence with algebra foundations",
                  status: "active",
                },
              ],
      },
    }),
  );

export const advanceAssessment = (state, result = {}) => {
  const currentStep = state.pedagogicalState.diagnosticStep ?? 0;
  const nextStep = currentStep + 1;
  const recommendedConceptId =
    result.recommendedConceptId ??
    state.pedagogicalState.recommendedConceptId ??
    "variables-and-expressions";

  if (nextStep >= ALGEBRA_DIAGNOSTIC_ITEMS.length) {
    return recordAssessmentCompletion(state, recommendedConceptId);
  }

  return createDefaultState({
    ...state,
    pedagogicalState: {
      ...appendUniqueRecentActivity(state, {
        type: "diagnostic-step-complete",
        step: currentStep,
      }),
      diagnosticStatus: "in-progress",
      diagnosticStep: nextStep,
      currentObjectiveId: getDiagnosticItem(nextStep).id,
      recommendedConceptId,
    },
  });
};

export const applyMasteryEvidence = (state, conceptId, delta = 1) => {
  const currentRecord = state.pedagogicalState.masteryByConcept[conceptId] ?? {};
  const lessonId = `lesson.${conceptId}`;
  const nextScore = Math.max(0, (currentRecord.score ?? 0) + delta);
  const correct = delta > 0;
  const misconceptionTags = deriveMisconceptionTags(conceptId, correct);
  const now = new Date().toISOString();
  const reviewDueAt = nextScore >= 1 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;
  const recommendedConceptId = getRecommendedConceptId({
    ...state.pedagogicalState.masteryByConcept,
    [conceptId]: {
      ...currentRecord,
      score: nextScore,
    },
  });

  const reviewSchedule = [
    ...(state.pedagogicalState.reviewSchedule ?? []).filter((entry) => entry.conceptId !== conceptId),
    ...(reviewDueAt
      ? [
          {
            conceptId,
            reviewDueAt,
            reason: "mastery-check",
          },
        ]
      : []),
  ].slice(-20);

  return updateMilestones(
    createDefaultState({
      ...state,
      pedagogicalState: {
        ...appendUniqueRecentActivity(state, {
          type: "mastery-evidence",
          conceptId,
          delta,
          recordedAt: now,
        }),
        currentConceptId: recommendedConceptId,
        currentLessonId: lessonId,
        currentObjectiveId: `concept.${recommendedConceptId}`,
        recommendedConceptId,
        masteryByConcept: {
          ...state.pedagogicalState.masteryByConcept,
          [conceptId]: {
            score: nextScore,
            status: nextScore >= 1 ? "mastered" : "in-progress",
            attempts: (currentRecord.attempts ?? 0) + 1,
            lastPracticedAt: now,
            reviewDueAt,
          },
        },
        misconceptionsByConcept: {
          ...state.pedagogicalState.misconceptionsByConcept,
          ...(misconceptionTags.length > 0
            ? {
                [conceptId]: [
                  ...(state.pedagogicalState.misconceptionsByConcept?.[conceptId] ?? []),
                  ...misconceptionTags,
                ].slice(-5),
              }
            : {}),
        },
        reviewSchedule,
        lessonRecords: {
          ...state.pedagogicalState.lessonRecords,
          [lessonId]: {
            lessonId,
            conceptId,
            status: nextScore >= 1 ? "completed" : "in-progress",
            sessionPhase: correct ? "feedback" : "remediation",
            lastUpdatedAt: now,
          },
        },
        attemptLog: [
          ...(state.pedagogicalState.attemptLog ?? []),
          buildAttemptRecord({
            conceptId,
            objectiveId: state.pedagogicalState.currentObjectiveId ?? `concept.${conceptId}`,
            correct,
            input: delta,
            inputType: "engine-evidence",
            phase: "tutoring",
          }),
        ].slice(-50),
        evidenceLog: [
          ...state.pedagogicalState.evidenceLog,
          {
            conceptId,
            delta,
            misconceptionTags,
            recordedAt: now,
            source: "tutoring-loop",
          },
        ].slice(-40),
      },
    }),
  );
};

export const advanceTutoringSession = (state, conceptId, action = "continue") => {
  const lessonId = `lesson.${conceptId}`;
  const lessonRecord = state.pedagogicalState.lessonRecords?.[lessonId] ?? {};
  const sessionPhase = lessonRecord.sessionPhase ?? DEFAULT_SESSION_PHASE;
  const recommendedConceptId = state.pedagogicalState.recommendedConceptId ?? conceptId;

  let nextConceptId = conceptId;
  let nextSessionPhase = sessionPhase;

  if (action === "continue") {
    if (sessionPhase === "explain") {
      nextSessionPhase = "worked-example";
    } else if (sessionPhase === "worked-example") {
      nextSessionPhase = "learner-attempt";
    } else if (sessionPhase === "feedback") {
      nextConceptId = recommendedConceptId;
      nextSessionPhase = "explain";
    } else if (sessionPhase === "remediation") {
      nextSessionPhase = "learner-attempt";
    }
  }

  return createDefaultState({
    ...state,
    pedagogicalState: {
      ...appendUniqueRecentActivity(state, {
        type: "session-phase-advance",
        conceptId,
        fromPhase: sessionPhase,
        toPhase: nextSessionPhase,
        recordedAt: new Date().toISOString(),
      }),
      currentConceptId: nextConceptId,
      currentLessonId: `lesson.${nextConceptId}`,
      currentObjectiveId: `concept.${nextConceptId}`,
      lessonRecords: {
        ...state.pedagogicalState.lessonRecords,
        [lessonId]: {
          lessonId,
          conceptId,
          status: lessonRecord.status ?? "in-progress",
          sessionPhase:
            nextConceptId === conceptId ? nextSessionPhase : state.pedagogicalState.lessonRecords?.[lessonId]?.sessionPhase ?? sessionPhase,
          lastUpdatedAt: new Date().toISOString(),
        },
        ...(nextConceptId !== conceptId
          ? {
              [`lesson.${nextConceptId}`]: {
                lessonId: `lesson.${nextConceptId}`,
                conceptId: nextConceptId,
                status: "in-progress",
                sessionPhase: "explain",
                lastUpdatedAt: new Date().toISOString(),
              },
            }
          : {}),
      },
    },
  });
};

export const createFallbackScene = (reason = "unknown") => ({
  version: 1,
  scene: {
    id: `fallback.${reason}`,
    kind: "fallback",
    objectiveId: "fallback.safe-path",
    transition: "fade",
    tone: "calm",
  },
  narration: {
    text: "Let’s continue another way.",
    maxChars: 64,
    estDurationMs: 1800,
    bargeInAllowed: true,
  },
  visualIntent: {
    type: "recipe",
    recipeId: "ambient_safe_path",
    vars: {
      palette: "sand-and-sky",
    },
  },
  interaction: {
    type: "none",
  },
  evidence: {
    observedSkill: "fallback-recovery",
    confidenceHint: 1,
  },
});

export const interpretScene = (blueprint, decision) => {
  const validation = validateSceneBlueprint(blueprint, decision);
  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      blueprint: createFallbackScene("validation-failure"),
    };
  }

  return {
    ok: true,
    errors: [],
    blueprint,
  };
};
