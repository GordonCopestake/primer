import test from "node:test";
import assert from "node:assert/strict";
import {
  TelemetrySink,
  createTelemetryEvent,
  TELEMETRY_EVENT_TYPES,
  validateTelemetryEvent,
} from "../packages/core/src/telemetry.js";

test("telemetry sink respects consent settings", () => {
  const sink = new TelemetrySink({ consent: false });
  assert.equal(sink.consent, false);
  sink.setConsent(true);
  assert.equal(sink.consent, true);
  sink.setConsent(false);
  assert.equal(sink.consent, false);
});

test("telemetry sink only tracks events when consent is given", () => {
  const sink = new TelemetrySink({ consent: false });
  sink.track({ type: "test", timestamp: new Date().toISOString(), data: {} });
  assert.equal(sink.getBufferedEvents().length, 0);
  sink.setConsent(true);
  sink.track({ type: "test", timestamp: new Date().toISOString(), data: {} });
  assert.equal(sink.getBufferedEvents().length, 2);
});

test("telemetry sink creates events with correct structure", () => {
  const event = createTelemetryEvent("test_event", { foo: "bar" });
  assert.equal(event.type, "test_event");
  assert.ok(event.timestamp);
  assert.equal(event.data.foo, "bar");
  assert.equal(event.version, "1.0.0");
});

test("telemetry sink tracks validation mismatch events", () => {
  const sink = new TelemetrySink({ consent: true });
  sink.trackValidationMismatch("2x+3", "5", { correct: false }, { conceptId: "test" });
  const events = sink.getEventsByType(TELEMETRY_EVENT_TYPES.VALIDATION_MISMATCH);
  assert.equal(events.length, 1);
});

test("telemetry sink flushes events correctly", async () => {
  const sink = new TelemetrySink({ consent: true, maxBufferSize: 10 });
  sink.track(createTelemetryEvent("event1"));
  sink.track(createTelemetryEvent("event2"));
  const result = await sink.flush();
  assert.equal(result.flushed, 2);
  assert.equal(sink.getBufferedEvents().length, 0);
});

test("validateTelemetryEvent checks event structure", () => {
  const validEvent = createTelemetryEvent(TELEMETRY_EVENT_TYPES.USER_ACTION);
  const result = validateTelemetryEvent(validEvent);
  assert.equal(result.valid, true);
});
