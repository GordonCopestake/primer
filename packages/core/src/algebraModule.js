export const ALGEBRA_FOUNDATIONS_MODULE_ID = "algebra-foundations";

const createConcept = (definition) => ({
  dependents: [],
  ...definition,
});

const withDependents = (concepts) =>
  concepts.map((concept) => ({
    ...concept,
    dependents: concepts.filter((candidate) => candidate.prerequisites.includes(concept.id)).map((candidate) => candidate.id),
  }));

export const createLesson = (definition) => ({
  lessonType: "guided-practice",
  responseType: "expression",
  choiceOptions: [],
  ...definition,
});

export const createAssessmentItem = (definition) => ({
  kind: "placement",
  rubric: "Use a bounded response that can be checked deterministically.",
  ...definition,
});

export const createAttempt = (overrides = {}) => ({
  result: "pending",
  evidence: [],
  misconceptionTags: [],
  feedback: "",
  ...overrides,
});

const ALGEBRA_CONCEPT_DEFINITIONS = [
  createConcept({
    id: "variables-and-expressions",
    label: "Variables and expressions",
    description: "Read and write simple algebraic expressions with variables.",
    prerequisites: [],
    masteryRule: "Solve two short translation tasks and explain what a variable stands for.",
    misconceptionTags: ["variable-as-label", "operator-order"],
  }),
  createConcept({
    id: "evaluate-expressions",
    label: "Evaluate expressions",
    description: "Substitute values and evaluate algebraic expressions correctly.",
    prerequisites: ["variables-and-expressions"],
    masteryRule: "Correctly substitute and simplify three expressions.",
    misconceptionTags: ["missed-substitution", "operator-order"],
  }),
  createConcept({
    id: "order-of-operations",
    label: "Order of operations",
    description: "Apply the correct operation order in arithmetic and algebraic expressions.",
    prerequisites: ["variables-and-expressions"],
    masteryRule: "Apply operation order correctly in three mixed examples.",
    misconceptionTags: ["left-to-right-only", "bracket-ignored"],
  }),
  createConcept({
    id: "like-terms",
    label: "Like terms",
    description: "Recognize and combine like terms in simple expressions.",
    prerequisites: ["evaluate-expressions", "order-of-operations"],
    masteryRule: "Combine like terms in three expressions without changing unlike terms.",
    misconceptionTags: ["term-merging", "coefficient-sign"],
  }),
  createConcept({
    id: "inverse-operations",
    label: "Inverse operations",
    description: "Use inverse operations to undo arithmetic changes to a variable.",
    prerequisites: ["evaluate-expressions"],
    masteryRule: "Name and apply the inverse operation in three cases.",
    misconceptionTags: ["same-operation-twice", "inverse-order"],
  }),
  createConcept({
    id: "one-step-addition-equations",
    label: "One-step addition equations",
    description: "Solve equations of the form x + a = b.",
    prerequisites: ["inverse-operations"],
    masteryRule: "Solve and check three one-step addition equations.",
    misconceptionTags: ["move-without-inverse", "unchecked-solution"],
  }),
  createConcept({
    id: "one-step-subtraction-equations",
    label: "One-step subtraction equations",
    description: "Solve equations of the form x - a = b.",
    prerequisites: ["inverse-operations"],
    masteryRule: "Solve and check three one-step subtraction equations.",
    misconceptionTags: ["sign-flip", "unchecked-solution"],
  }),
  createConcept({
    id: "one-step-multiplication-equations",
    label: "One-step multiplication equations",
    description: "Solve equations of the form ax = b.",
    prerequisites: ["inverse-operations"],
    masteryRule: "Solve and check three one-step multiplication equations.",
    misconceptionTags: ["divide-sign-error", "unchecked-solution"],
  }),
  createConcept({
    id: "one-step-division-equations",
    label: "One-step division equations",
    description: "Solve equations of the form x / a = b.",
    prerequisites: ["inverse-operations"],
    masteryRule: "Solve and check three one-step division equations.",
    misconceptionTags: ["multiply-sign-error", "unchecked-solution"],
  }),
  createConcept({
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
  }),
  createConcept({
    id: "distributive-property",
    label: "Distributive property",
    description: "Expand simple bracketed expressions correctly.",
    prerequisites: ["like-terms"],
    masteryRule: "Expand three expressions with correct sign handling.",
    misconceptionTags: ["outer-term-only", "sign-distribution"],
  }),
  createConcept({
    id: "equations-with-like-terms",
    label: "Equations with like terms",
    description: "Simplify then solve equations that require combining like terms.",
    prerequisites: ["two-step-equations", "like-terms"],
    masteryRule: "Simplify and solve three equations with like terms.",
    misconceptionTags: ["combine-after-solving", "coefficient-loss"],
  }),
  createConcept({
    id: "equations-with-distribution",
    label: "Equations with distribution",
    description: "Use distribution then solve a linear equation.",
    prerequisites: ["two-step-equations", "distributive-property"],
    masteryRule: "Distribute and solve three equations correctly.",
    misconceptionTags: ["distribution-sign", "step-order"],
  }),
  createConcept({
    id: "variables-on-both-sides",
    label: "Variables on both sides",
    description: "Collect variable terms and constants to solve equations with variables on both sides.",
    prerequisites: ["equations-with-like-terms", "equations-with-distribution"],
    masteryRule: "Solve three equations with variables on both sides and justify the move.",
    misconceptionTags: ["subtract-wrong-side", "coefficient-loss"],
  }),
  createConcept({
    id: "fraction-equations",
    label: "Fraction equations",
    description: "Solve simple linear equations involving fractions.",
    prerequisites: ["variables-on-both-sides"],
    masteryRule: "Solve two fraction equations and explain the clearing step.",
    misconceptionTags: ["partial-clearing", "denominator-drop"],
  }),
  createConcept({
    id: "decimal-equations",
    label: "Decimal equations",
    description: "Solve linear equations involving decimals accurately.",
    prerequisites: ["variables-on-both-sides"],
    masteryRule: "Solve two decimal equations with accurate arithmetic.",
    misconceptionTags: ["decimal-place-shift", "round-too-early"],
  }),
  createConcept({
    id: "solution-checking",
    label: "Check a solution",
    description: "Substitute a proposed solution back into the original equation.",
    prerequisites: ["two-step-equations"],
    masteryRule: "Check three solutions and identify one invalid result.",
    misconceptionTags: ["check-simplified-form-only", "arithmetic-check-error"],
  }),
  createConcept({
    id: "inequalities-intro",
    label: "One-variable inequalities",
    description: "Solve and interpret simple one-variable inequalities.",
    prerequisites: ["two-step-equations"],
    masteryRule: "Solve three inequalities and describe the solution set.",
    misconceptionTags: ["treat-like-equation", "reverse-sign-missed"],
  }),
  createConcept({
    id: "translate-word-problems",
    label: "Translate word problems",
    description: "Turn short verbal descriptions into algebraic equations.",
    prerequisites: ["variables-and-expressions", "two-step-equations"],
    masteryRule: "Translate three short prompts into valid equations.",
    misconceptionTags: ["unknown-not-defined", "operation-word-confusion"],
  }),
  createConcept({
    id: "solve-word-problems",
    label: "Solve word problems",
    description: "Solve bounded word problems with linear equations and interpret the answer.",
    prerequisites: ["translate-word-problems", "solution-checking"],
    masteryRule: "Solve two short word problems and interpret the answer in context.",
    misconceptionTags: ["equation-right-answer-wrong", "unit-drop"],
  }),
];

export const ALGEBRA_FOUNDATIONS_MODULE = {
  id: ALGEBRA_FOUNDATIONS_MODULE_ID,
  title: "Algebra Foundations",
  slug: "algebra-foundations",
  subject: "mathematics",
  focus: "linear equations",
  description: "A bounded algebra module covering variables, expressions, and linear equations.",
  conceptGraph: withDependents(ALGEBRA_CONCEPT_DEFINITIONS),
};

export const ALGEBRA_DIAGNOSTIC_ITEMS = [
  createAssessmentItem({
    id: "diagnostic.variables",
    conceptId: "variables-and-expressions",
    prompt: "What does the variable mean in x + 3 = 10?",
    inputType: "short-explanation",
    expectedResponse: "unknown number",
    expectedKeywords: ["unknown", "number", "value", "variable"],
    misconceptionTag: "variable-as-label",
    kind: "readiness",
  }),
  createAssessmentItem({
    id: "diagnostic.order-of-operations",
    conceptId: "order-of-operations",
    prompt: "Which value matches 2 + 3 * 4?",
    inputType: "multiple-choice",
    expectedResponse: "14",
    choiceOptions: ["14", "20", "24", "11"],
    misconceptionTag: "left-to-right-only",
    kind: "readiness",
  }),
  createAssessmentItem({
    id: "diagnostic.substitution",
    conceptId: "evaluate-expressions",
    prompt: "Evaluate 2x + 1 when x = 4.",
    inputType: "numeric",
    expectedResponse: "9",
    misconceptionTag: "missed-substitution",
    kind: "placement",
  }),
  createAssessmentItem({
    id: "diagnostic.one-step",
    conceptId: "one-step-addition-equations",
    prompt: "Solve x + 5 = 12.",
    inputType: "expression",
    expectedResponse: "7",
    misconceptionTag: "move-without-inverse",
    kind: "placement",
  }),
  createAssessmentItem({
    id: "diagnostic.two-step",
    conceptId: "two-step-equations",
    prompt: "Solve 2x + 3 = 11.",
    inputType: "expression",
    expectedResponse: "4",
    misconceptionTag: "wrong-first-step",
    kind: "placement",
  }),
];

export const ALGEBRA_LESSONS = [
  createLesson({
    id: "lesson.variables-and-expressions",
    conceptId: "variables-and-expressions",
    lessonType: "explain-and-try",
    title: "What a variable means",
    objective: "Introduce variables as placeholders and read simple expressions.",
    workedExample: "If x means 4, then x + 3 means 7.",
    responseType: "multiple-choice",
    prompt: "Which expression means 'a number increased by 2'?",
    expectedResponse: "x + 2",
    choiceOptions: ["x + 2", "2x", "x - 2", "2 - x"],
    hint: "Name the unknown first, then describe how the expression changes it.",
    remediation: "A variable stands for a value that can change. Read x + 2 as 'two more than x', not as a single joined symbol.",
    successFeedback: "You treated the variable like a number placeholder, which is exactly the right start.",
  }),
  createLesson({
    id: "lesson.evaluate-expressions",
    conceptId: "evaluate-expressions",
    lessonType: "worked-example",
    title: "Substitute and evaluate",
    objective: "Replace a variable with a value and simplify.",
    workedExample: "When x = 4, 2x + 1 = 9.",
    responseType: "expression",
    prompt: "Evaluate 3x - 2 when x = 5.",
    expectedResponse: "13",
    hint: "Substitute the given value everywhere the variable appears before simplifying.",
    remediation: "Write the value in place of x first: 3(5) - 2. Then simplify in order instead of mixing substitution and arithmetic together.",
    successFeedback: "The substitution and simplification both held together cleanly.",
  }),
  createLesson({
    id: "lesson.order-of-operations",
    conceptId: "order-of-operations",
    lessonType: "explain-and-try",
    title: "Choose the operation order",
    objective: "Apply multiplication before addition unless brackets change the order.",
    workedExample: "In 2 + 3 x 4, multiply 3 x 4 first to get 12, then add 2 to get 14.",
    responseType: "multiple-choice",
    prompt: "What is the value of 2 + 3 * 4?",
    expectedResponse: "14",
    choiceOptions: ["14", "20", "24", "11"],
    hint: "Look for multiplication before addition.",
    remediation: "Order of operations prevents left-to-right mistakes here. Multiply first, then add the remaining constant.",
    successFeedback: "You applied the operation order correctly instead of reading straight across.",
  }),
  createLesson({
    id: "lesson.one-step-equations",
    conceptId: "one-step-addition-equations",
    lessonType: "guided-practice",
    title: "Undo addition",
    objective: "Solve x + a = b using inverse operations.",
    workedExample: "x + 5 = 12 becomes x = 7.",
    responseType: "expression",
    prompt: "Solve x + 4 = 11.",
    expectedResponse: "7",
    hint: "Ask which operation is happening to x, then undo that exact operation on both sides.",
    remediation: "In x + 4 = 11, the variable has 4 added to it. Subtract 4 from both sides before checking the result in the original equation.",
    successFeedback: "You used the inverse operation and isolated the variable correctly.",
  }),
  createLesson({
    id: "lesson.one-step-subtraction-equations",
    conceptId: "one-step-subtraction-equations",
    lessonType: "guided-practice",
    title: "Undo subtraction",
    objective: "Solve x - a = b by reversing the subtraction step.",
    workedExample: "x - 3 = 8 becomes x = 11 after adding 3 to both sides.",
    responseType: "expression",
    prompt: "Solve x - 6 = 5.",
    expectedResponse: "11",
    hint: "Undo the subtraction by adding the same amount to both sides.",
    remediation: "If 6 was subtracted from x, add 6 back to both sides. Then check that your result makes the original equation true.",
    successFeedback: "You reversed the subtraction and restored the missing value correctly.",
  }),
  createLesson({
    id: "lesson.one-step-multiplication-equations",
    conceptId: "one-step-multiplication-equations",
    lessonType: "guided-practice",
    title: "Undo multiplication",
    objective: "Solve ax = b by dividing both sides by the coefficient.",
    workedExample: "4x = 20 becomes x = 5 after dividing both sides by 4.",
    responseType: "expression",
    prompt: "Solve 4x = 20.",
    expectedResponse: "5",
    hint: "The coefficient is multiplying the variable, so use division to undo it.",
    remediation: "To isolate x in 4x = 20, divide both sides by 4. Skipping the division or dividing by the wrong number causes the common error here.",
    successFeedback: "You identified the coefficient and removed it with the correct inverse operation.",
  }),
  createLesson({
    id: "lesson.one-step-division-equations",
    conceptId: "one-step-division-equations",
    lessonType: "guided-practice",
    title: "Undo division",
    objective: "Solve x / a = b by multiplying both sides by the divisor.",
    workedExample: "x / 3 = 5 becomes x = 15 after multiplying both sides by 3.",
    responseType: "expression",
    prompt: "Solve x / 3 = 5.",
    expectedResponse: "15",
    hint: "If the variable is being divided, multiply both sides by that divisor.",
    remediation: "Division by 3 is attached to x, so multiply both sides by 3 to undo it. Then substitute your answer back to check.",
    successFeedback: "You reversed the division step and isolated the variable cleanly.",
  }),
  createLesson({
    id: "lesson.two-step-equations",
    conceptId: "two-step-equations",
    lessonType: "guided-practice",
    title: "Two-step equations",
    objective: "Solve equations that need two inverse operations.",
    workedExample: "2x + 3 = 11 becomes 2x = 8, then x = 4.",
    responseType: "expression",
    prompt: "Solve 3x - 2 = 13.",
    expectedResponse: "5",
    hint: "Undo the constant first, then undo the coefficient.",
    remediation: "Treat 3x - 2 = 13 as two operations on x. Add 2 first to isolate 3x, then divide by 3. Reversing the order usually causes the mistake here.",
    successFeedback: "You reversed the operations in a stable order and arrived at the correct value.",
  }),
  createLesson({
    id: "lesson.like-terms",
    conceptId: "like-terms",
    lessonType: "guided-practice",
    title: "Combine like terms",
    objective: "Group terms with the same variable part and combine only their coefficients.",
    workedExample: "3x + 2x - 4 becomes 5x - 4 because only the x-terms combine.",
    responseType: "expression",
    prompt: "Simplify 4x + 3x - 2.",
    expectedResponse: "7x - 2",
    hint: "Look for matching variable parts before you add or subtract coefficients.",
    remediation: "Only like terms combine. 4x and 3x can become 7x, but constants stay separate until the end.",
    successFeedback: "You combined the matching terms without changing the unlike ones.",
  }),
  createLesson({
    id: "lesson.inverse-operations",
    conceptId: "inverse-operations",
    lessonType: "explain-and-try",
    title: "Use inverse operations",
    objective: "Recognize which operation undoes the one attached to the variable.",
    workedExample: "If 6 is added to x, subtracting 6 undoes that change.",
    responseType: "multiple-choice",
    prompt: "What inverse operation undoes multiplying by 5?",
    expectedResponse: "divide by 5",
    choiceOptions: ["add 5", "divide by 5", "subtract 5", "multiply by 5"],
    hint: "Think about how to get back to the original value.",
    remediation: "Inverse operations reverse each other: addition with subtraction, multiplication with division.",
    successFeedback: "You matched the operation with its inverse correctly.",
  }),
  createLesson({
    id: "lesson.distributive-property",
    conceptId: "distributive-property",
    lessonType: "explain-and-try",
    title: "Expand with distribution",
    objective: "Multiply the outside factor by every term inside the bracket.",
    workedExample: "3(x + 2) becomes 3x + 6 because 3 multiplies both x and 2.",
    responseType: "multiple-choice",
    prompt: "Which expression is equivalent to 3(x + 2)?",
    expectedResponse: "3x + 6",
    choiceOptions: ["3x + 6", "3x + 2", "x + 6", "6x"],
    hint: "The factor outside the bracket has to affect every inside term.",
    remediation: "Distribution means multiplying the outside number by each term inside the bracket, not just the first one.",
    successFeedback: "You distributed across both terms instead of stopping after the variable term.",
  }),
  createLesson({
    id: "lesson.equations-with-like-terms",
    conceptId: "equations-with-like-terms",
    lessonType: "guided-practice",
    title: "Combine, then solve",
    objective: "Simplify the left side first when like terms appear before solving.",
    workedExample: "2x + x = 12 becomes 3x = 12, then x = 4.",
    responseType: "expression",
    prompt: "Solve 2x + x = 12.",
    expectedResponse: "4",
    hint: "Combine the like terms on one side before using inverse operations.",
    remediation: "2x and x are like terms, so rewrite the equation as 3x = 12 first. Solving before simplifying usually loses a term.",
    successFeedback: "You simplified the like terms first and then solved the cleaner equation.",
  }),
  createLesson({
    id: "lesson.equations-with-distribution",
    conceptId: "equations-with-distribution",
    lessonType: "guided-practice",
    title: "Distribute, then solve",
    objective: "Expand the bracket correctly before applying equation-solving steps.",
    workedExample: "2(x + 3) = 14 becomes 2x + 6 = 14, then 2x = 8, then x = 4.",
    responseType: "expression",
    prompt: "Solve 3(x + 2) = 15.",
    expectedResponse: "3",
    hint: "Multiply every term inside the bracket before isolating the variable.",
    remediation: "Distribution affects each term in the bracket. After expanding, solve the new linear equation step by step.",
    successFeedback: "You distributed across the bracket and then solved the equation in order.",
  }),
  createLesson({
    id: "lesson.variables-on-both-sides",
    conceptId: "variables-on-both-sides",
    lessonType: "guided-practice",
    title: "Collect variables on one side",
    objective: "Move variable terms together before isolating the remaining coefficient.",
    workedExample: "3x + 2 = x + 10 becomes 2x + 2 = 10, then 2x = 8, then x = 4.",
    responseType: "expression",
    prompt: "Solve 2x + 3 = x + 8.",
    expectedResponse: "5",
    hint: "Subtract one variable term first so all the x terms end up on one side.",
    remediation: "Start by removing x from one side of the equation: 2x + 3 = x + 8 becomes x + 3 = 8. Then isolate x with one more step.",
    successFeedback: "You collected the variable terms first and kept the equation balanced while solving.",
  }),
  createLesson({
    id: "lesson.fraction-equations",
    conceptId: "fraction-equations",
    lessonType: "guided-practice",
    title: "Clear the fraction step",
    objective: "Solve a simple fraction equation by undoing the fraction operation carefully.",
    workedExample: "x / 4 = 3 becomes x = 12 after multiplying both sides by 4.",
    responseType: "expression",
    prompt: "Solve x / 2 = 7.",
    expectedResponse: "14",
    hint: "Ask what operation is attached to x and undo it on both sides.",
    remediation: "The variable is being divided by 2, so multiply both sides by 2. Avoid dropping the denominator without doing the same operation to both sides.",
    successFeedback: "You cleared the fraction step correctly and preserved the balance of the equation.",
  }),
  createLesson({
    id: "lesson.decimal-equations",
    conceptId: "decimal-equations",
    lessonType: "guided-practice",
    title: "Solve with decimals",
    objective: "Solve a linear equation with decimals using the same inverse-operation logic.",
    workedExample: "x + 1.5 = 4 becomes x = 2.5 after subtracting 1.5 from both sides.",
    responseType: "expression",
    prompt: "Solve x + 2.5 = 6.",
    expectedResponse: "3.5",
    hint: "Treat the decimal like any other constant and undo it carefully.",
    remediation: "Subtract 2.5 from both sides to isolate x. Lining up the decimal values can help prevent place-value mistakes.",
    successFeedback: "You handled the decimal subtraction accurately and isolated the variable correctly.",
  }),
  createLesson({
    id: "lesson.solution-checking",
    conceptId: "solution-checking",
    lessonType: "worked-example",
    title: "Check by substitution",
    objective: "Verify a proposed solution by placing it back into the original equation.",
    workedExample: "If x = 4 for 2x + 3 = 11, then 2(4) + 3 = 11, so the solution works.",
    responseType: "multiple-choice",
    prompt: "Does x = 3 satisfy x + 5 = 8?",
    expectedResponse: "yes",
    choiceOptions: ["yes", "no"],
    hint: "Substitute the value into the original equation, not the simplified one.",
    remediation: "Checking means replacing the variable in the original equation and seeing whether both sides still match.",
    successFeedback: "You used substitution to confirm the equation stayed balanced.",
  }),
  createLesson({
    id: "lesson.inequalities-intro",
    conceptId: "inequalities-intro",
    lessonType: "explain-and-try",
    title: "Read an inequality solution",
    objective: "Describe the solution to a simple one-variable inequality.",
    workedExample: "If x + 4 > 9, then x > 5 because values greater than 5 keep the statement true.",
    responseType: "multiple-choice",
    prompt: "Which solution matches x + 4 > 9?",
    expectedResponse: "x > 5",
    choiceOptions: ["x > 5", "x < 5", "x = 5", "x >= 5"],
    hint: "Undo the addition first, then keep the greater-than direction.",
    remediation: "Solve the inequality like a one-step equation here: subtract 4 from both sides to get x > 5.",
    successFeedback: "You isolated the variable and kept the inequality meaning intact.",
  }),
  createLesson({
    id: "lesson.translate-word-problems",
    conceptId: "translate-word-problems",
    lessonType: "explain-and-try",
    title: "Translate words into equations",
    objective: "Turn short verbal statements into a variable equation before solving.",
    workedExample: "\"Five more than a number is 12\" becomes x + 5 = 12.",
    responseType: "multiple-choice",
    prompt: "Which equation matches: seven less than a number is 9?",
    expectedResponse: "x - 7 = 9",
    choiceOptions: ["x - 7 = 9", "7 - x = 9", "x + 7 = 9", "9 - 7 = x"],
    hint: "Name the unknown, then map the operation words into algebra symbols.",
    remediation: "Choose a variable for the unknown first. Then translate phrases like 'more than' or 'less than' carefully into operations.",
    successFeedback: "You translated the language into a valid algebra equation.",
  }),
  createLesson({
    id: "lesson.solve-word-problems",
    conceptId: "solve-word-problems",
    lessonType: "guided-practice",
    title: "Solve and interpret",
    objective: "Solve the equation and then state what the answer means in the problem context.",
    workedExample: "If a ticket costs x pounds and two tickets cost 18, then 2x = 18 so x = 9 pounds.",
    responseType: "expression",
    prompt: "A number plus 6 is 15. What is the number?",
    expectedResponse: "9",
    hint: "Solve the equation first, then restate the answer in words.",
    remediation: "Keep the context attached to the algebra. After solving, check that your answer still makes sense in the original sentence.",
    successFeedback: "You solved the equation and linked the result back to the situation.",
  }),
];

export const ALGEBRA_ASSESSMENT_ITEMS = ALGEBRA_DIAGNOSTIC_ITEMS.map((item, index) => createAssessmentItem({
  ...item,
  kind: index < 2 ? "readiness" : "placement",
  rubric: "Use a bounded response that can be checked deterministically.",
}));

export const ALGEBRA_ATTEMPT_TEMPLATE = createAttempt();

export const ALGEBRA_VALIDATION_CONSTRAINTS = Object.freeze({
  supportedResponseTypes: Object.freeze(["expression", "multiple-choice", "short-text", "numeric", "short-explanation"]),
  boundedInputTypes: Object.freeze(["math-input", "tap-choice", "read-respond", "none"]),
  deterministicPolicy: "Model help may rephrase explanations and hints, but it must not invent graph structure, mastery rules, or expected answers.",
});

export const getAlgebraConcept = (conceptId) =>
  ALGEBRA_FOUNDATIONS_MODULE.conceptGraph.find((concept) => concept.id === conceptId) ?? null;

export const getInitialConceptId = () => ALGEBRA_FOUNDATIONS_MODULE.conceptGraph[0]?.id ?? null;

export const getDiagnosticPlacementConceptId = () =>
  ALGEBRA_DIAGNOSTIC_ITEMS[ALGEBRA_DIAGNOSTIC_ITEMS.length - 1]?.conceptId ?? getInitialConceptId();

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

export const getAssessmentItemsForConcept = (conceptId) =>
  ALGEBRA_ASSESSMENT_ITEMS.filter((item) => item.conceptId === conceptId);

export const ALGEBRA_SUBJECT_PACK = Object.freeze({
  id: ALGEBRA_FOUNDATIONS_MODULE_ID,
  title: ALGEBRA_FOUNDATIONS_MODULE.title,
  getModule() {
    return ALGEBRA_FOUNDATIONS_MODULE;
  },
  listConcepts() {
    return ALGEBRA_FOUNDATIONS_MODULE.conceptGraph;
  },
  listLessons() {
    return ALGEBRA_LESSONS;
  },
  listAssessmentItems() {
    return ALGEBRA_ASSESSMENT_ITEMS;
  },
  getInitialConceptId,
  getDiagnosticPlacementConceptId,
  getAttemptTemplate() {
    return ALGEBRA_ATTEMPT_TEMPLATE;
  },
  getValidationConstraints() {
    return ALGEBRA_VALIDATION_CONSTRAINTS;
  },
});
