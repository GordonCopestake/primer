const TOKEN_PATTERN = /\s*([A-Za-z]+|\d*\.?\d+|[()+\-*/=])\s*/gy;
const SUPPORTED_VARIABLES = new Set(["x"]);
const EQUIVALENCE_CHECKPOINTS = Object.freeze([-3, -1, 0, 1, 2, 4]);

const conceptMessages = Object.freeze({
  "variables-and-expressions": "Focus on what the variable stands for before combining anything.",
  "evaluate-expressions": "Substitute the given value first, then simplify in order.",
  "one-step-addition-equations": "Undo the addition with the inverse operation, then check the result.",
  "two-step-equations": "Reverse the operations one step at a time instead of jumping straight to the answer.",
});

const createValidationResult = ({ correct, reason, mode, feedback, details = {} }) => ({
  correct,
  reason,
  mode,
  feedback,
  details,
});

const getMathFeedbackMessage = (validation, conceptId = "algebra") => {
  if (validation.correct) {
    return validation.mode === "numeric"
      ? "That answer checks out numerically."
      : "That expression is equivalent to the expected result.";
  }

  if (validation.reason === "syntax") {
    return "The response could not be parsed as safe algebra. Check symbols, operators, and equation format.";
  }

  if (validation.reason === "equation-form") {
    return "Keep the equality sign and isolate the value or expression you want to show.";
  }

  if (validation.reason === "unsupported-variable") {
    return "Use the authored variable for this step and avoid introducing a new symbol.";
  }

  if (validation.reason === "divide-by-zero") {
    return "That step creates division by zero. Check the denominator before simplifying.";
  }

  return conceptMessages[conceptId] ?? "Try the next step more carefully and check each operation.";
};

const tokenizeMathExpression = (input) => {
  const source = String(input ?? "").trim();
  const tokens = [];
  TOKEN_PATTERN.lastIndex = 0;

  while (TOKEN_PATTERN.lastIndex < source.length) {
    const match = TOKEN_PATTERN.exec(source);
    if (!match) {
      throw new Error("syntax");
    }
    tokens.push(match[1]);
  }

  return tokens;
};

const parseMathExpression = (input) => {
  const tokens = tokenizeMathExpression(input);
  let index = 0;

  const peek = () => tokens[index] ?? null;
  const consume = (expected = null) => {
    const token = tokens[index] ?? null;
    if (expected && token !== expected) {
      throw new Error("syntax");
    }
    index += 1;
    return token;
  };

  const parsePrimary = () => {
    const token = peek();
    if (token === null) {
      throw new Error("syntax");
    }

    if (token === "(") {
      consume("(");
      const expr = parseAdditive();
      consume(")");
      return expr;
    }

    if (token === "+" || token === "-") {
      consume(token);
      return {
        type: "unary",
        operator: token,
        argument: parsePrimary(),
      };
    }

    if (/^\d*\.?\d+$/.test(token)) {
      consume();
      return {
        type: "number",
        value: Number(token),
      };
    }

    if (/^[A-Za-z]+$/.test(token)) {
      consume();
      return {
        type: "symbol",
        name: token.toLowerCase(),
      };
    }

    throw new Error("syntax");
  };

  const parseMultiplicative = () => {
    let node = parsePrimary();

    while (peek() === "*" || peek() === "/") {
      const operator = consume();
      node = {
        type: "binary",
        operator,
        left: node,
        right: parsePrimary(),
      };
    }

    return node;
  };

  const parseAdditive = () => {
    let node = parseMultiplicative();

    while (peek() === "+" || peek() === "-") {
      const operator = consume();
      node = {
        type: "binary",
        operator,
        left: node,
        right: parseMultiplicative(),
      };
    }

    return node;
  };

  const expression = parseAdditive();
  if (index !== tokens.length) {
    throw new Error("syntax");
  }
  return expression;
};

const evaluateMathAst = (node, scope = {}) => {
  switch (node.type) {
    case "number":
      return node.value;
    case "symbol": {
      if (!SUPPORTED_VARIABLES.has(node.name)) {
        throw new Error("unsupported-variable");
      }
      const value = scope[node.name];
      if (!Number.isFinite(value)) {
        throw new Error("unsupported-variable");
      }
      return value;
    }
    case "unary": {
      const value = evaluateMathAst(node.argument, scope);
      return node.operator === "-" ? -value : value;
    }
    case "binary": {
      const left = evaluateMathAst(node.left, scope);
      const right = evaluateMathAst(node.right, scope);

      if (node.operator === "+") return left + right;
      if (node.operator === "-") return left - right;
      if (node.operator === "*") return left * right;
      if (node.operator === "/") {
        if (Math.abs(right) <= 1e-9) {
          throw new Error("divide-by-zero");
        }
        return left / right;
      }
      throw new Error("syntax");
    }
    default:
      throw new Error("syntax");
  }
};

const hasUnsupportedVariables = (node) => {
  if (!node || typeof node !== "object") {
    return false;
  }
  if (node.type === "symbol") {
    return !SUPPORTED_VARIABLES.has(node.name);
  }
  if (node.type === "unary") {
    return hasUnsupportedVariables(node.argument);
  }
  if (node.type === "binary") {
    return hasUnsupportedVariables(node.left) || hasUnsupportedVariables(node.right);
  }
  return false;
};

const splitEquationSides = (expression) => {
  const parts = String(expression ?? "")
    .split("=")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 2) {
    throw new Error("equation-form");
  }

  if (parts.length === 2) {
    return {
      hasEquation: true,
      left: parts[0],
      right: parts[1],
    };
  }

  return {
    hasEquation: false,
    left: null,
    right: parts[0] ?? "",
  };
};

const parseComparableExpression = (expression) => {
  const split = splitEquationSides(expression);
  const comparable = split.hasEquation ? split.right : split.right;
  const ast = parseMathExpression(comparable);
  return {
    ...split,
    comparable,
    ast,
  };
};

const expressionsAreEquivalent = (leftAst, rightAst) =>
  EQUIVALENCE_CHECKPOINTS.every((x) => {
    const left = evaluateMathAst(leftAst, { x });
    const right = evaluateMathAst(rightAst, { x });
    return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= 1e-6;
  });

const classifyMathError = ({ inputComparable, expectedComparable, inputHasEquation, expectedHasEquation, errorCode = "conceptual" }) => {
  if (errorCode === "syntax" || errorCode === "unsupported-variable" || errorCode === "divide-by-zero") {
    return errorCode;
  }

  if (inputHasEquation !== expectedHasEquation) {
    return "equation-form";
  }

  if ((inputComparable ?? "").includes("=") || (expectedComparable ?? "").includes("=")) {
    return "equation-form";
  }

  return "conceptual";
};

export const validateMathResponse = (input, expectedExpression, conceptId = null) => {
  const normalizedInput = String(input ?? "").trim();
  const normalizedExpected = String(expectedExpression ?? "").trim();

  if (!normalizedInput || !normalizedExpected) {
    return createValidationResult({
      correct: false,
      reason: "syntax",
      mode: "expression",
      feedback: getMathFeedbackMessage({ correct: false, reason: "syntax" }, conceptId ?? "algebra"),
    });
  }

  try {
    const parsedInput = parseComparableExpression(normalizedInput);
    const parsedExpected = parseComparableExpression(normalizedExpected);

    if (hasUnsupportedVariables(parsedInput.ast) || hasUnsupportedVariables(parsedExpected.ast)) {
      return createValidationResult({
        correct: false,
        reason: "unsupported-variable",
        mode: "expression",
        feedback: getMathFeedbackMessage({ correct: false, reason: "unsupported-variable" }, conceptId ?? "algebra"),
      });
    }

    const numericInput = evaluateMathAst(parsedInput.ast, { x: 0 });
    const numericExpected = evaluateMathAst(parsedExpected.ast, { x: 0 });
    const numericOnly = !parsedInput.comparable.toLowerCase().includes("x") && !parsedExpected.comparable.toLowerCase().includes("x");

    if (numericOnly) {
      const correct = Math.abs(numericInput - numericExpected) <= 1e-6;
      const reason = correct
        ? "numeric"
        : classifyMathError({
            inputComparable: parsedInput.comparable,
            expectedComparable: parsedExpected.comparable,
            inputHasEquation: parsedInput.hasEquation,
            expectedHasEquation: parsedExpected.hasEquation,
          });
      return createValidationResult({
        correct,
        reason,
        mode: "numeric",
        feedback: getMathFeedbackMessage({ correct, reason, mode: "numeric" }, conceptId ?? "algebra"),
      });
    }

    const equivalent = expressionsAreEquivalent(parsedInput.ast, parsedExpected.ast);
    const reason = equivalent
      ? "expression"
      : classifyMathError({
          inputComparable: parsedInput.comparable,
          expectedComparable: parsedExpected.comparable,
          inputHasEquation: parsedInput.hasEquation,
          expectedHasEquation: parsedExpected.hasEquation,
        });

    return createValidationResult({
      correct: equivalent,
      reason,
      mode: "expression",
      feedback: getMathFeedbackMessage({ correct: equivalent, reason, mode: "expression" }, conceptId ?? "algebra"),
      details: {
        inputComparable: parsedInput.comparable,
        expectedComparable: parsedExpected.comparable,
      },
    });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "syntax";
    const reason = classifyMathError({
      inputComparable: normalizedInput,
      expectedComparable: normalizedExpected,
      inputHasEquation: normalizedInput.includes("="),
      expectedHasEquation: normalizedExpected.includes("="),
      errorCode,
    });
    return createValidationResult({
      correct: false,
      reason,
      mode: "expression",
      feedback: getMathFeedbackMessage({ correct: false, reason, mode: "expression" }, conceptId ?? "algebra"),
    });
  }
};

export const MATH_VALIDATION_PLUGIN = Object.freeze({
  validateResponse(input, expectedExpression, context = {}) {
    return validateMathResponse(input, expectedExpression, context.conceptId ?? null);
  },
  classifyError(input, expectedExpression) {
    const result = validateMathResponse(input, expectedExpression);
    return result.reason;
  },
});

export const getMathValidationFeedbackMessage = getMathFeedbackMessage;
