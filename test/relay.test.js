import test from "node:test";
import assert from "node:assert/strict";

import { handleChatRoute } from "../relay/src/routes/chat.js";
import { handleDirectorRoute } from "../relay/src/routes/director.js";
import { handleImageRoute } from "../relay/src/routes/image.js";
import { handleVisionRoute } from "../relay/src/routes/vision.js";

test("director route validates, redacts, and returns a bounded scene", async () => {
  const result = await handleDirectorRoute({
    requestId: "director-1",
    learnerSummary: "Locale en-GB. Literacy stage 1.",
    runtimeSummary: "recent turn",
    latestInput: {
      type: "tap-choice",
      content: "reading.symbol-match.1:map",
    },
    hardConstraints: {
      activeDomain: "reading",
      literacyStage: 1,
      objectiveId: "reading.symbol-match.1",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["tap-choice", "none"],
      maxNarrationChars: 120,
      imageGenerationAllowed: false,
      locale: "en-GB",
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.blueprint.scene.objectiveId, "reading.symbol-match.1");
  assert.match(result.headers["x-primer-provider"], /local-mock/);
});

test("director route blocks mixed-age-unsafe content", async () => {
  const result = await handleDirectorRoute({
    requestId: "director-2",
    learnerSummary: "Locale en-GB.",
    runtimeSummary: "graphic violence",
    latestInput: {
      type: "tap-choice",
      content: "reading.symbol-match.1:map",
    },
    hardConstraints: {
      activeDomain: "reading",
      literacyStage: 1,
      objectiveId: "reading.symbol-match.1",
      allowedSceneKinds: ["lesson", "fallback"],
      allowedInteractionTypes: ["tap-choice", "none"],
      maxNarrationChars: 120,
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
    cacheKey: "reading:sand-and-sky",
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
      target: "M",
      learnerStage: 2,
      domain: "writing",
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.evidence.observedSkill, "symbol-trace");
});

test("chat route returns bounded mixed-age-safe guidance", async () => {
  const result = await handleChatRoute({
    requestId: "chat-1",
    learnerSummary: "Locale en-GB. Literacy stage 1.",
    runtimeSummary: "Learner asked for an example.",
    latestInput: {
      type: "transcript",
      content: "How do I match this sound?",
    },
    objectiveId: "reading.symbol-match.1",
    maxResponseChars: 140,
  });

  assert.equal(result.status, 200);
  assert.match(result.body.reply.text, /great question/i);
  assert.ok(result.body.reply.text.length <= 140);
  assert.equal(result.body.suggestedNextScene.objectiveId, "reading.symbol-match.1");
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
      literacyStage: 0,
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
