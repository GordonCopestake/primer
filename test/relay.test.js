import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { handleChatRoute } from "../relay/src/routes/chat.js";
import { handleDirectorRoute } from "../relay/src/routes/director.js";
import { handleImageRoute } from "../relay/src/routes/image.js";
import { createRelayServer } from "../relay/src/server.js";
import { handleVisionRoute } from "../relay/src/routes/vision.js";

test("director route validates, redacts, and returns a bounded scene", async () => {
  const result = await handleDirectorRoute({
    requestId: "director-1",
    learnerSummary: "Locale en-GB. Algebra module selected. Current concept variables-and-expressions.",
    runtimeSummary: "recent turn",
    latestInput: {
      type: "math-input",
      content: "x = 7",
    },
    hardConstraints: {
      activeDomain: "mathematics",
      moduleId: "algebra-foundations",
      conceptId: "one-step-addition-equations",
      phase: "tutoring",
      objectiveId: "concept.one-step-addition-equations",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["math-input", "none"],
      maxNarrationChars: 180,
      imageGenerationAllowed: false,
      locale: "en-GB",
      tutoringContext: {
        sessionPhase: "learner-attempt",
        lessonType: "guided-practice",
        expectedExpression: "7",
        prompt: "Solve x + 5 = 12.",
      },
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.blueprint.scene.objectiveId, "concept.one-step-addition-equations");
  assert.equal(result.body.blueprint.interaction.type, "math-input");
  assert.match(result.headers["x-primer-provider"], /local-mock/);
});

test("director route uses authored multiple-choice tutoring context when provided", async () => {
  const result = await handleDirectorRoute({
    requestId: "director-choice-1",
    learnerSummary: "Locale en-GB. Algebra module selected.",
    runtimeSummary: "recent turn",
    latestInput: {
      type: "system-start",
      content: "startup",
    },
    hardConstraints: {
      activeDomain: "mathematics",
      moduleId: "algebra-foundations",
      conceptId: "order-of-operations",
      phase: "diagnostic",
      objectiveId: "diagnostic.order-of-operations",
      allowedSceneKinds: ["assessment", "fallback"],
      allowedInteractionTypes: ["tap-choice", "none"],
      maxNarrationChars: 180,
      imageGenerationAllowed: false,
      locale: "en-GB",
      tutoringContext: {
        choiceOptions: ["14", "20", "24", "11"],
        expectedResponse: "14",
        prompt: "Which value matches 2 + 3 * 4?",
      },
    },
  });

  assert.equal(result.status, 200);
  assert.deepEqual(
    result.body.blueprint.interaction.options.map((option) => option.label),
    ["14", "20", "24", "11"],
  );
});

test("director route blocks mixed-age-unsafe content", async () => {
  const result = await handleDirectorRoute({
    requestId: "director-2",
    learnerSummary: "Locale en-GB.",
    runtimeSummary: "graphic violence",
    latestInput: {
      type: "math-input",
      content: "x = 7",
    },
    hardConstraints: {
      activeDomain: "mathematics",
      moduleId: "algebra-foundations",
      conceptId: "one-step-addition-equations",
      phase: "tutoring",
      objectiveId: "concept.one-step-addition-equations",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["math-input", "none"],
      maxNarrationChars: 180,
      imageGenerationAllowed: false,
      locale: "en-GB",
    },
  });

  assert.equal(result.status, 422);
  assert.equal(result.body.error.code, "moderation_blocked");
});

test("image route queues first and serves ready on subsequent request", async () => {
  const request = {
    requestId: "image-1",
    recipeId: "neutral_choice_board",
    vars: {
      palette: "sand-and-sky",
    },
    cacheKey: "algebra:sand-and-sky",
  };

  const queued = await handleImageRoute(request);
  const ready = await handleImageRoute(request);

  assert.equal(queued.status, 202);
  assert.equal(queued.body.status, "queued");
  assert.equal(ready.status, 200);
  assert.equal(ready.body.status, "ready");
});

test("vision route returns advisory evidence only", async () => {
  const result = await handleVisionRoute({
    requestId: "vision-1",
    imageBase64: "ZmFrZQ==",
    task: "complex-symbol-check",
    context: {
      target: "x",
      learnerStage: 2,
      domain: "mathematics",
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.evidence.observedSkill, "symbol-trace");
});

test("chat route returns bounded mixed-age-safe guidance", async () => {
  const result = await handleChatRoute({
    requestId: "chat-1",
    learnerSummary: "Locale en-GB. Algebra module selected.",
    runtimeSummary: "Learner asked for a worked example.",
    latestInput: {
      type: "transcript",
      content: "How do I solve 2x + 3 = 11?",
    },
    objectiveId: "concept.two-step-equations",
    maxResponseChars: 140,
  });

  assert.equal(result.status, 200);
  assert.match(result.body.reply.text, /great question/i);
  assert.ok(result.body.reply.text.length <= 140);
  assert.equal(result.body.suggestedNextScene.objectiveId, "concept.two-step-equations");
});

test("director route can return an algebra math-input scene", async () => {
  const result = await handleDirectorRoute({
    requestId: "director-algebra-1",
    learnerSummary: "Locale en-GB. Algebra module selected.",
    runtimeSummary: "recent turn",
    latestInput: {
      type: "system-start",
      content: "startup",
    },
    hardConstraints: {
      activeDomain: "mathematics",
      moduleId: "algebra-foundations",
      conceptId: "two-step-equations",
      objectiveId: "concept.two-step-equations",
      phase: "tutoring",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["math-input", "none"],
      maxNarrationChars: 180,
      imageGenerationAllowed: false,
      locale: "en-GB",
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.blueprint.scene.objectiveId, "concept.two-step-equations");
  assert.equal(result.body.blueprint.interaction.type, "math-input");
  assert.match(result.body.blueprint.interaction.expressionPrompt, /2x \+ 3 = 11/);
});

test("relay server responds to browser preflight with CORS headers", async () => {
  const server = createRelayServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  const response = await new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: "127.0.0.1",
        port,
        path: "/director",
        method: "OPTIONS",
      },
      (res) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
        });
      },
    );
    request.on("error", reject);
    request.end();
  });

  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

  assert.equal(response.statusCode, 204);
  assert.equal(response.headers["access-control-allow-origin"], "*");
  assert.match(String(response.headers["access-control-allow-methods"]), /POST/);
});
