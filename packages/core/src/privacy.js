const BLOCKED_CONTENT_PATTERNS = [
  /sexual/i,
  /romance/i,
  /alcohol/i,
  /drug/i,
  /graphic violence/i,
  /partisan/i,
  /horror/i,
  /humiliation/i,
  /adult reward/i,
];

export const truncateForRelay = (text, maxChars = 220) => {
  if (typeof text !== "string") {
    return "";
  }

  const normalized = text.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 1))}…`;
};

export const redactRelayRequest = (request) => ({
  ...request,
  learnerSummary: truncateForRelay(request?.learnerSummary, 180),
  runtimeSummary: request?.runtimeSummary ? truncateForRelay(request.runtimeSummary, 220) : null,
  latestInput: {
    ...request?.latestInput,
    content: truncateForRelay(request?.latestInput?.content, 80),
  },
});

export const detectBlockedContent = (...values) =>
  values
    .filter((value) => typeof value === "string" && value.length > 0)
    .flatMap((value) =>
      BLOCKED_CONTENT_PATTERNS.filter((pattern) => pattern.test(value)).map((pattern) => pattern.source),
    );
