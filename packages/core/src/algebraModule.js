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
