import { redactRelayRequest, detectBlockedContent } from "../../../packages/core/src/privacy.js";
import {
  createStableError,
  validateChatRequest,
  validateChatResponse,
} from "../../../packages/schemas/src/index.js";
import { PINNED_PROVIDER, proposeChatReply } from "../providers/mockProvider.js";

const jsonResponse = (status, body) => ({
  status,
  headers: {
    "content-type": "application/json",
    "x-primer-provider": PINNED_PROVIDER,
  },
  body,
});

export const handleChatRoute = async (requestBody) => {
  const validation = validateChatRequest(requestBody);
  if (!validation.ok) {
    return jsonResponse(
      400,
      createStableError("chat_request_invalid", "Chat request validation failed.", validation.errors),
    );
  }

  const minimizedRequest = redactRelayRequest(requestBody);
  const blockedMatches = detectBlockedContent(
    minimizedRequest.learnerSummary,
    minimizedRequest.runtimeSummary,
    minimizedRequest.latestInput.content,
  );

  if (blockedMatches.length > 0) {
    return jsonResponse(
      422,
      createStableError("moderation_blocked", "Request blocked by mixed-age-safe moderation.", blockedMatches),
    );
  }

  const response = proposeChatReply(minimizedRequest);
  const responseValidation = validateChatResponse(response, minimizedRequest.maxResponseChars);
  if (!responseValidation.ok) {
    return jsonResponse(
      502,
      createStableError("chat_response_invalid", "Chat response validation failed.", responseValidation.errors),
    );
  }

  return jsonResponse(200, response);
};
