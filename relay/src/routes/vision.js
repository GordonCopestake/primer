import { createStableError } from "../../../packages/schemas/src/index.js";

const jsonResponse = (status, body) => ({
  status,
  headers: {
    "content-type": "application/json",
  },
  body,
});

const isValidVisionRequest = (requestBody) =>
  requestBody?.requestId &&
  typeof requestBody?.imageBase64 === "string" &&
  requestBody.imageBase64.length > 0 &&
  ["free-draw-interpretation", "complex-symbol-check"].includes(requestBody?.task) &&
  requestBody?.context?.domain &&
  typeof requestBody?.context?.learnerStage === "number";

export const handleVisionRoute = async (requestBody) => {
  if (!isValidVisionRequest(requestBody)) {
    return jsonResponse(
      400,
      createStableError("vision_request_invalid", "Vision request validation failed.", ["Malformed vision request."]),
    );
  }

  const target = requestBody.context.target ? `That ${requestBody.context.target} looks steady.` : "That looks steady.";
  return jsonResponse(200, {
    success: true,
    confidence: 0.78,
    feedbackAudio: target,
    evidence: {
      observedSkill: requestBody.task === "complex-symbol-check" ? "symbol-trace" : "free-draw",
      confidenceHint: 0.78,
    },
  });
};
