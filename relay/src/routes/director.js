import { redactRelayRequest, detectBlockedContent } from "../../../packages/core/src/privacy.js";
import {
  createStableError,
  validateDirectorRequest,
  validateDirectorResponse,
} from "../../../packages/schemas/src/index.js";
import { MOCK_PROVIDER_ADAPTER, PINNED_PROVIDER } from "../providers/mockProvider.js";

const jsonResponse = (status, body) => ({
  status,
  headers: {
    "content-type": "application/json",
    "x-primer-provider": PINNED_PROVIDER,
  },
  body,
});

export const handleDirectorRoute = async (requestBody) => {
  const validation = validateDirectorRequest(requestBody);
  if (!validation.ok) {
    return jsonResponse(
      400,
      createStableError("director_request_invalid", "Director request validation failed.", validation.errors),
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

  const response = MOCK_PROVIDER_ADAPTER.sendTutorTurn(minimizedRequest);
  const responseValidation = validateDirectorResponse(response, minimizedRequest.hardConstraints);
  if (!responseValidation.ok) {
    return jsonResponse(
      502,
      createStableError("director_response_invalid", "Director response validation failed.", responseValidation.errors),
    );
  }

  return jsonResponse(200, response);
};
