import { createStableError } from "../../../packages/schemas/src/index.js";

const imageCache = new Map();

const jsonResponse = (status, body) => ({
  status,
  headers: {
    "content-type": "application/json",
  },
  body,
});

const normalizeImageRequest = (requestBody) => {
  if (
    !requestBody?.requestId ||
    !requestBody?.recipeId ||
    typeof requestBody?.cacheKey !== "string" ||
    typeof requestBody?.vars !== "object" ||
    Array.isArray(requestBody?.vars)
  ) {
    return null;
  }

  return requestBody;
};

export const handleImageRoute = async (requestBody) => {
  const request = normalizeImageRequest(requestBody);
  if (!request) {
    return jsonResponse(
      400,
      createStableError("image_request_invalid", "Image request validation failed.", ["Malformed image request."]),
    );
  }

  const cached = imageCache.get(request.cacheKey);
  if (cached) {
    return jsonResponse(200, {
      status: "ready",
      cacheKey: request.cacheKey,
      mimeType: "image/svg+xml",
      bytes: cached.bytes,
      blobUrl: `/assets/${encodeURIComponent(request.cacheKey)}.svg`,
    });
  }

  const bytes = JSON.stringify({ recipeId: request.recipeId, vars: request.vars }).length * 6;
  imageCache.set(request.cacheKey, { bytes });

  return jsonResponse(202, {
    status: "queued",
    cacheKey: request.cacheKey,
    jobId: `image-${request.requestId}`,
  });
};
