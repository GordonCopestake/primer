import {
  ALGEBRA_DIAGNOSTIC_ITEMS,
  ALGEBRA_FOUNDATIONS_MODULE,
  getDiagnosticPlacementConceptId,
  getInitialConceptId,
  getLessonForConcept,
  getRecommendedConceptId,
} from "./algebraModule.js";
import { createAssessmentAttemptRecord, createEvidenceRecord } from "../../schemas/src/index.js";
import { createDefaultState } from "./state.js";

const DIAGNOSTIC_SCENE_KINDS = ["assessment", "fallback"];
const LESSON_SCENE_KINDS = ["lesson", "practice", "review", "fallback"];
const DEFAULT_SESSION_PHASE = "explain";
const DECISION_LOG_LIMIT = 40;

const makeDiagnosticDecision = (state, item) => ({
  moduleId: ALGEBRA_FOUNDATIONS_MODULE.id,
  activeDomain: "mathematics",
  phase: "diagnostic",
  conceptId: item.conceptId,
  objectiveId: item.id,
  prompt: item.prompt,
  inputType: item.inputType,
  expectedResponse: item.expectedResponse ?? null,
  expectedKeywords: item.expectedKeywords ?? [],
  choiceOptions: item.choiceOptions ?? [],
  misconceptionTag: item.misconceptionTag ?? null,
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
  const prerequisiteGaps = state.pedagogicalState.prerequisiteGaps ?? [];
  const likelyMisconceptions = state.pedagogicalState.likelyMisconceptions ?? [];
  const conceptMisconceptions = concept?.misconceptionTags ?? [];
  const matchingMisconceptions = likelyMisconceptions.filter((tag) => conceptMisconceptions.includes(tag));

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
    readiness: state.pedagogicalState.readiness,
    prerequisiteGaps,
    likelyMisconceptions,
    isPlacementConcept: prerequisiteGaps.includes(conceptId),
    matchingMisconceptions,
    supportLevel:
      prerequisiteGaps.includes(conceptId) && matchingMisconceptions.length > 0
        ? "targeted-remediation"
        : prerequisiteGaps.includes(conceptId)
          ? "placement-review"
          : "standard",
    recommendationKind: lessonRecord.recommendationKind ?? null,
    recommendationReason: lessonRecord.recommendationReason ?? null,
  };
};

const getDiagnosticItem = (step) => ALGEBRA_DIAGNOSTIC_ITEMS[Math.max(0, Math.min(step, ALGEBRA_DIAGNOSTIC_ITEMS.length - 1))];

const getPlacementConceptIdForDiagnosticItem = (item) => item?.conceptId ?? getInitialConceptId();

const summarizeDiagnosticOutcome = (assessmentItems = {}) => {
  const diagnosticRecords = ALGEBRA_DIAGNOSTIC_ITEMS.map((item) => ({
    item,
    record: assessmentItems[item.id] ?? null,
  }));
  const totalItems = diagnosticRecords.length;
  const correctCount = diagnosticRecords.filter(({ record }) => record?.correct === true).length;
  const incorrectRecords = diagnosticRecords.filter(({ record }) => record?.correct !== true);
  const prerequisiteGaps = [...new Set(incorrectRecords.map(({ item }) => getPlacementConceptIdForDiagnosticItem(item)))];
  const likelyMisconceptions = [
    ...new Set(
      incorrectRecords
        .map(({ record, item }) => record?.misconceptionTag ?? item.misconceptionTag ?? null)
        .filter(Boolean),
    ),
  ];
  const recommendedConceptId = prerequisiteGaps[0] ?? getDiagnosticPlacementConceptId();
  const readiness =
    correctCount >= totalItems - 1 ? "ready" : correctCount >= Math.ceil(totalItems / 2) ? "developing" : "needs-foundations";

  return {
    totalItems,
    correctCount,
    incorrectCount: totalItems - correctCount,
    readiness,
    prerequisiteGaps,
    likelyMisconceptions,
    recommendedConceptId,
  };
};

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

const getRelatedInteractionIds = (state, conceptId) => {
  const matchingEntries = (state.runtimeSession.recentInteractionMemory ?? []).filter(
    (entry) => (conceptId ? entry.conceptId === conceptId : true),
  );
  const pool = matchingEntries.length > 0 ? matchingEntries : state.runtimeSession.recentInteractionMemory ?? [];
  return pool.slice(-2).map((entry) => entry.interactionId).filter(Boolean);
};

const buildAttemptRecord = ({ conceptId, objectiveId, correct, input, inputType, phase }) => ({
  attemptId: `${objectiveId}:${Date.now()}`,
  conceptId,
  objectiveId,
  phase,
  inputType,
  learnerResponse: input,
  result: correct ? "correct" : "needs-review",
  supportReason: null,
  recordedAt: new Date().toISOString(),
});

const appendTutoringDecision = (state, decision) =>
  [...(state.pedagogicalState.tutoringDecisions ?? []), decision].slice(-DECISION_LOG_LIMIT);

const getSupportReasonForConcept = (state, conceptId) => {
  const prerequisiteGaps = state.pedagogicalState.prerequisiteGaps ?? [];
  const likelyMisconceptions = state.pedagogicalState.likelyMisconceptions ?? [];
  const concept = ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.find((item) => item.id === conceptId);
  const conceptMisconceptions = concept?.misconceptionTags ?? [];
  const hasMatchingMisconception = likelyMisconceptions.some((tag) => conceptMisconceptions.includes(tag));

  if (prerequisiteGaps.includes(conceptId) && hasMatchingMisconception) {
    return "diagnostic-targeted-remediation";
  }

  if (prerequisiteGaps.includes(conceptId)) {
    return "diagnostic-placement-review";
  }

  return null;
};

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

export const recordAssessmentCompletion = (state, placement = getInitialConceptId()) => {
  const diagnosticSummary =
    typeof placement === "string"
      ? {
          totalItems: ALGEBRA_DIAGNOSTIC_ITEMS.length,
          correctCount: ALGEBRA_DIAGNOSTIC_ITEMS.length,
          incorrectCount: 0,
          readiness: "ready",
          prerequisiteGaps: [],
          likelyMisconceptions: [],
          recommendedConceptId: placement,
        }
      : placement;
  const recommendedConceptId = diagnosticSummary?.recommendedConceptId ?? getInitialConceptId();

  return updateMilestones(
    createDefaultState({
      ...state,
      pedagogicalState: {
        ...state.pedagogicalState,
        diagnosticStep: ALGEBRA_DIAGNOSTIC_ITEMS.length,
        diagnosticStatus: "complete",
        readiness: diagnosticSummary?.readiness ?? "ready",
        prerequisiteGaps: diagnosticSummary?.prerequisiteGaps ?? [],
        likelyMisconceptions: diagnosticSummary?.likelyMisconceptions ?? [],
        diagnosticSummary,
        currentConceptId: recommendedConceptId,
        currentObjectiveId: `concept.${recommendedConceptId}`,
        recommendedConceptId,
        recentActivity: [
          ...state.pedagogicalState.recentActivity,
          {
            type: "diagnostic-complete",
            conceptId: recommendedConceptId,
            readiness: diagnosticSummary?.readiness ?? "ready",
            prerequisiteGaps: diagnosticSummary?.prerequisiteGaps ?? [],
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
};

export const advanceAssessment = (state, result = {}) => {
  const currentStep = state.pedagogicalState.diagnosticStep ?? 0;
  const nextStep = currentStep + 1;
  const currentItem = getDiagnosticItem(currentStep);
  const recommendedConceptId =
    result.recommendedConceptId ??
    state.pedagogicalState.recommendedConceptId ??
    getInitialConceptId();
  const correct = result.correct;
  const misconceptionTag =
    correct === false ? currentItem?.misconceptionTag ?? deriveMisconceptionTags(currentItem?.conceptId, false)[0] ?? null : null;

  const recordedAssessmentItems = currentItem
    ? {
        ...state.pedagogicalState.assessmentItems,
        [currentItem.id]: {
          objectiveId: currentItem.id,
          conceptId: currentItem.conceptId,
          inputType: currentItem.inputType,
          kind: currentStep < 2 ? "readiness" : "placement",
          correct: correct === true,
          completed: typeof correct === "boolean",
          skipped: typeof correct !== "boolean",
          expectedResponse: currentItem.expectedResponse ?? null,
          misconceptionTag,
          recordedAt: new Date().toISOString(),
        },
      }
    : state.pedagogicalState.assessmentItems;
  const assessmentAttempt =
    currentItem
      ? createAssessmentAttemptRecord({
          attemptId: `${currentItem.id}:${Date.now()}`,
          objectiveId: currentItem.id,
          conceptId: currentItem.conceptId,
          inputType: currentItem.inputType,
          learnerResponse: result.learnerResponse ?? null,
          result: typeof correct === "boolean" ? (correct ? "correct" : "needs-review") : "skipped",
          misconceptionTag,
          source: "diagnostic",
          relatedInteractionIds: getRelatedInteractionIds(state, currentItem.conceptId),
          recordedAt: new Date().toISOString(),
        })
      : null;
  const diagnosticEvidence =
    currentItem
      ? createEvidenceRecord({
          evidenceId: `diagnostic:${currentItem.id}:${Date.now()}`,
          conceptId: currentItem.conceptId,
          objectiveId: currentItem.id,
          source: "diagnostic",
          delta: correct === true ? 1 : correct === false ? -1 : 0,
          misconceptionTags: misconceptionTag ? [misconceptionTag] : [],
          relatedInteractionIds: getRelatedInteractionIds(state, currentItem.conceptId),
          recordedAt: new Date().toISOString(),
        })
      : null;

  if (nextStep >= ALGEBRA_DIAGNOSTIC_ITEMS.length) {
    return recordAssessmentCompletion(
      createDefaultState({
        ...state,
        pedagogicalState: {
          ...state.pedagogicalState,
          assessmentItems: recordedAssessmentItems,
          assessmentAttempts: assessmentAttempt
            ? [...(state.pedagogicalState.assessmentAttempts ?? []), assessmentAttempt].slice(-40)
            : state.pedagogicalState.assessmentAttempts,
          evidenceLog: diagnosticEvidence
            ? [...(state.pedagogicalState.evidenceLog ?? []), diagnosticEvidence].slice(-40)
            : state.pedagogicalState.evidenceLog,
        },
      }),
      summarizeDiagnosticOutcome(recordedAssessmentItems),
    );
  }

  return createDefaultState({
    ...state,
    pedagogicalState: {
      ...appendUniqueRecentActivity(state, {
        type: "diagnostic-step-complete",
        step: currentStep,
        conceptId: currentItem?.conceptId ?? null,
        correct: typeof correct === "boolean" ? correct : null,
      }),
      diagnosticStatus: "in-progress",
      diagnosticStep: nextStep,
      currentObjectiveId: getDiagnosticItem(nextStep).id,
      recommendedConceptId,
      assessmentItems: recordedAssessmentItems,
      assessmentAttempts: assessmentAttempt
        ? [...(state.pedagogicalState.assessmentAttempts ?? []), assessmentAttempt].slice(-40)
        : state.pedagogicalState.assessmentAttempts,
      evidenceLog: diagnosticEvidence
        ? [...(state.pedagogicalState.evidenceLog ?? []), diagnosticEvidence].slice(-40)
        : state.pedagogicalState.evidenceLog,
      misconceptionsByConcept:
        misconceptionTag && currentItem?.conceptId
          ? {
              ...state.pedagogicalState.misconceptionsByConcept,
              [currentItem.conceptId]: [
                ...(state.pedagogicalState.misconceptionsByConcept?.[currentItem.conceptId] ?? []),
                misconceptionTag,
              ].slice(-5),
            }
          : state.pedagogicalState.misconceptionsByConcept,
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
  const supportReason = correct ? currentRecord.supportReason ?? getSupportReasonForConcept(state, conceptId) : "tutoring-error-remediation";
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
  const recommendationKind = correct ? "advance" : "stay";
  const recommendationReason = correct
    ? reviewDueAt
      ? "mastery-demonstrated-review-scheduled"
      : "mastery-demonstrated"
    : "needs-remediation";

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
        currentConceptId: conceptId,
        currentLessonId: lessonId,
        currentObjectiveId: `concept.${conceptId}`,
        recommendedConceptId,
        masteryByConcept: {
          ...state.pedagogicalState.masteryByConcept,
          [conceptId]: {
            score: nextScore,
            status: nextScore >= 1 ? "mastered" : "in-progress",
            attempts: (currentRecord.attempts ?? 0) + 1,
            lastPracticedAt: now,
            reviewDueAt,
            supportReason,
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
        tutoringDecisions: appendTutoringDecision(state, {
          decisionId: `tutoring-decision:${conceptId}:${Date.now()}`,
          conceptId,
          sessionPhaseBefore: state.pedagogicalState.lessonRecords?.[lessonId]?.sessionPhase ?? "learner-attempt",
          sessionPhaseAfter: correct ? "feedback" : "remediation",
          decisionOutcome: correct ? "advance" : "stay",
          transitionReason: recommendationReason,
          supportReason,
          recommendedConceptId,
          recordedAt: now,
        }),
        lessonRecords: {
          ...state.pedagogicalState.lessonRecords,
          [lessonId]: {
            lessonId,
            conceptId,
            status: nextScore >= 1 ? "completed" : "in-progress",
            sessionPhase: correct ? "feedback" : "remediation",
            supportReason,
            recommendationKind,
            recommendationReason,
            lastUpdatedAt: now,
          },
        },
        attemptLog: [
          ...(state.pedagogicalState.attemptLog ?? []),
          {
            ...buildAttemptRecord({
              conceptId,
              objectiveId: state.pedagogicalState.currentObjectiveId ?? `concept.${conceptId}`,
            correct,
            input: delta,
            inputType: "engine-evidence",
              phase: "tutoring",
            }),
            relatedInteractionIds: getRelatedInteractionIds(state, conceptId),
            supportReason,
          },
        ].slice(-50),
        evidenceLog: [
          ...state.pedagogicalState.evidenceLog,
          createEvidenceRecord({
            evidenceId: `tutoring:${conceptId}:${Date.now()}`,
            conceptId,
            objectiveId: state.pedagogicalState.currentObjectiveId ?? `concept.${conceptId}`,
            lessonId,
            delta,
            misconceptionTags,
            recordedAt: now,
            source: "tutoring-loop",
            relatedInteractionIds: getRelatedInteractionIds(state, conceptId),
            supportReason,
          }),
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
  const concept = ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.find((item) => item.id === conceptId);
  const prerequisiteGaps = state.pedagogicalState.prerequisiteGaps ?? [];
  const likelyMisconceptions = state.pedagogicalState.likelyMisconceptions ?? [];
  const conceptMisconceptions = concept?.misconceptionTags ?? [];
  const matchingMisconceptions = likelyMisconceptions.filter((tag) => conceptMisconceptions.includes(tag));
  const shouldInsertTargetedRemediation =
    prerequisiteGaps.includes(conceptId) &&
    matchingMisconceptions.length > 0 &&
    sessionPhase === "worked-example" &&
    lessonRecord.supportPlanApplied !== true;
  const supportReason = shouldInsertTargetedRemediation
    ? "diagnostic-targeted-remediation"
    : prerequisiteGaps.includes(conceptId)
      ? "diagnostic-placement-review"
      : lessonRecord.supportReason ?? null;

  let nextConceptId = conceptId;
  let nextSessionPhase = sessionPhase;
  let supportPlanApplied = lessonRecord.supportPlanApplied === true;
  let decisionOutcome = "advance";
  let transitionReason = "continue-session";

  if (action === "continue") {
    if (sessionPhase === "explain") {
      nextSessionPhase = "worked-example";
      transitionReason = "concept-introduction-complete";
    } else if (sessionPhase === "worked-example") {
      if (shouldInsertTargetedRemediation) {
        nextSessionPhase = "remediation";
        supportPlanApplied = true;
        decisionOutcome = "stay";
        transitionReason = "targeted-remediation-needed";
      } else {
        nextSessionPhase = "learner-attempt";
        transitionReason = "worked-example-complete";
      }
    } else if (sessionPhase === "feedback") {
      nextSessionPhase = "recommendation";
      transitionReason = lessonRecord.recommendationReason ?? "mastery-demonstrated";
    } else if (sessionPhase === "recommendation") {
      nextConceptId = recommendedConceptId;
      nextSessionPhase = "explain";
      decisionOutcome = nextConceptId === conceptId ? "stay" : "redirect";
      transitionReason = nextConceptId === conceptId ? "repeat-current-concept" : "recommended-next-concept";
    } else if (sessionPhase === "remediation") {
      nextSessionPhase = "learner-attempt";
      transitionReason = "retry-after-remediation";
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
        decisionOutcome,
        transitionReason,
        recordedAt: new Date().toISOString(),
      }),
      currentConceptId: nextConceptId,
      currentLessonId: `lesson.${nextConceptId}`,
      currentObjectiveId: `concept.${nextConceptId}`,
      tutoringDecisions: appendTutoringDecision(state, {
        decisionId: `session-transition:${conceptId}:${Date.now()}`,
        conceptId,
        sessionPhaseBefore: sessionPhase,
        sessionPhaseAfter: nextSessionPhase,
        decisionOutcome,
        transitionReason,
        supportReason,
        recommendedConceptId,
        recordedAt: new Date().toISOString(),
      }),
      lessonRecords: {
        ...state.pedagogicalState.lessonRecords,
        [lessonId]: {
          lessonId,
          conceptId,
          status: lessonRecord.status ?? "in-progress",
          sessionPhase:
            nextConceptId === conceptId ? nextSessionPhase : state.pedagogicalState.lessonRecords?.[lessonId]?.sessionPhase ?? sessionPhase,
          supportPlanApplied,
          supportReason,
          recommendationKind: lessonRecord.recommendationKind ?? null,
          recommendationReason: lessonRecord.recommendationReason ?? null,
          lastTransitionOutcome: decisionOutcome,
          lastTransitionReason: transitionReason,
          lastUpdatedAt: new Date().toISOString(),
        },
        ...(nextConceptId !== conceptId
          ? {
              [`lesson.${nextConceptId}`]: {
                lessonId: `lesson.${nextConceptId}`,
                conceptId: nextConceptId,
                status: "in-progress",
                sessionPhase: "explain",
                supportPlanApplied: false,
                supportReason: getSupportReasonForConcept(state, nextConceptId),
                recommendationKind: null,
                recommendationReason: null,
                lastUpdatedAt: new Date().toISOString(),
              },
            }
          : {}),
      },
    },
  });
};
