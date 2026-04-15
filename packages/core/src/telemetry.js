export const TELEMETRY_VERSION = "1.0.0";

export const TELEMETRY_EVENT_TYPES = {
  VALIDATION_MISMATCH: "validation_mismatch",
  VALIDATION_LOOP: "validation_loop",
  CRASH: "crash",
  SCENE_TRANSITION: "scene_transition",
  CONCEPT_MASTERY: "concept_mastery",
  DIAGNOSTIC_COMPLETE: "diagnostic_complete",
  TUTORING_SESSION: "tutoring_session",
  USER_ACTION: "user_action",
  SYSTEM_ERROR: "system_error",
  PERFORMANCE: "performance",
  CONSENT_CHANGE: "consent_change",
  TRACE_DONATION: "trace_donation",
};

export const createTelemetryEvent = (type, data = {}, metadata = {}) => ({
  type,
  timestamp: new Date().toISOString(),
  version: TELEMETRY_VERSION,
  data,
  metadata: { ...metadata, appVersion: "0.1.0" },
});

export class TelemetrySink {
  constructor(options = {}) {
    this._buffer = [];
    this._maxBufferSize = options.maxBufferSize ?? 100;
    this._consent = options.consent ?? false;
    this._storageKey = options.storageKey ?? "primer.telemetry.buffer";
    this._onConsentChange = options.onConsentChange ?? (() => {});
  }

  get consent() { return this._consent; }

  setConsent(value) {
    const previousConsent = this._consent;
    this._consent = Boolean(value);
    if (previousConsent !== this._consent) {
      this._onConsentChange(this._consent);
      this.track(createTelemetryEvent(TELEMETRY_EVENT_TYPES.CONSENT_CHANGE, { previousConsent, newConsent: this._consent }));
      if (!this._consent) this._buffer = [];
    }
  }

  track(event) {
    if (!this._consent) return;
    const telemetryEvent = typeof event === "string" ? createTelemetryEvent(event) : event;
    if (telemetryEvent.type === TELEMETRY_EVENT_TYPES.VALIDATION_LOOP ||
        telemetryEvent.type === TELEMETRY_EVENT_TYPES.CRASH ||
        telemetryEvent.type === TELEMETRY_EVENT_TYPES.SYSTEM_ERROR) {
      telemetryEvent.data.priority = "high";
    }
    this._buffer.push(telemetryEvent);
    if (this._buffer.length > this._maxBufferSize) this._buffer = this._buffer.slice(-this._maxBufferSize);
    this._persistBuffer();
  }

  trackValidationMismatch(input, expected, actual, context = {}) {
    this.track(createTelemetryEvent(TELEMETRY_EVENT_TYPES.VALIDATION_MISMATCH, { input, expected, actual, context }));
  }

  trackValidationLoop(conceptId, attempts, context = {}) {
    this.track(createTelemetryEvent(TELEMETRY_EVENT_TYPES.VALIDATION_LOOP, { conceptId, attempts, context }));
  }

  trackCrash(error, context = {}) {
    this.track(createTelemetryEvent(TELEMETRY_EVENT_TYPES.CRASH, {
      errorMessage: error?.message ?? String(error),
      errorStack: error?.stack ?? "",
      context,
    }));
  }

  trackConceptMastery(conceptId, score, previousScore, context = {}) {
    this.track(createTelemetryEvent(TELEMETRY_EVENT_TYPES.CONCEPT_MASTERY, { conceptId, score, previousScore, context }));
  }

  trackDiagnosticComplete(startingConceptId, diagnosticResults, context = {}) {
    this.track(createTelemetryEvent(TELEMETRY_EVENT_TYPES.DIAGNOSTIC_COMPLETE, { startingConceptId, diagnosticResults, context }));
  }

  trackTutoringSession(conceptId, duration, interactions, context = {}) {
    this.track(createTelemetryEvent(TELEMETRY_EVENT_TYPES.TUTORING_SESSION, { conceptId, durationMs: duration, interactionCount: interactions, context }));
  }

  trackTraceDonation(traceData, conceptId, context = {}) {
    this.track(createTelemetryEvent(TELEMETRY_EVENT_TYPES.TRACE_DONATION, { traceHash: this._hashTrace(traceData), conceptId, context }));
  }

  trackUserAction(action, context = {}) {
    this.track(createTelemetryEvent(TELEMETRY_EVENT_TYPES.USER_ACTION, { action, context }));
  }

  trackSceneTransition(fromScene, toScene, reason, context = {}) {
    this.track(createTelemetryEvent(TELEMETRY_EVENT_TYPES.SCENE_TRANSITION, { fromScene, toScene, reason, context }));
  }

  trackPerformance(metric, value, context = {}) {
    this.track(createTelemetryEvent(TELEMETRY_EVENT_TYPES.PERFORMANCE, { metric, value, context }));
  }

  getBufferedEvents() { return [...this._buffer]; }
  getEventsByType(type) { return this._buffer.filter((event) => event.type === type); }
  getHighPriorityEvents() {
    return this._buffer.filter((event) =>
      event.data?.priority === "high" ||
      [TELEMETRY_EVENT_TYPES.CRASH, TELEMETRY_EVENT_TYPES.SYSTEM_ERROR, TELEMETRY_EVENT_TYPES.VALIDATION_LOOP].includes(event.type)
    );
  }

  async flush() {
    if (!this._consent || this._buffer.length === 0) return { flushed: 0, events: [] };
    const events = [...this._buffer];
    this._buffer = [];
    this._persistBuffer();
    return { flushed: events.length, events, flushedAt: new Date().toISOString() };
  }

  async exportForReview() {
    const events = [...this._buffer];
    const summary = { exportedAt: new Date().toISOString(), totalEvents: events.length, byType: {}, consentStatus: this._consent, appVersion: "0.1.0" };
    for (const event of events) summary.byType[event.type] = (summary.byType[event.type] ?? 0) + 1;
    return { summary, events };
  }

  revoke() {
    this._buffer = [];
    this._persistBuffer();
    this._consent = false;
    this._onConsentChange(false);
  }

  getStats() {
    return { consent: this._consent, bufferedEvents: this._buffer.length, maxBufferSize: this._maxBufferSize, byType: this._buffer.reduce((acc, event) => { acc[event.type] = (acc[event.type] ?? 0) + 1; return acc; }, {}) };
  }

  _hashTrace(traceData) {
    if (typeof traceData !== "string") traceData = JSON.stringify(traceData);
    let hash = 0;
    for (let i = 0; i < traceData.length; i++) { const char = traceData.charCodeAt(i); hash = (hash << 5) - hash + char; hash = hash & hash; }
    return `trace_${Math.abs(hash).toString(16)}`;
  }

  _persistBuffer() {
    try { if (typeof localStorage !== "undefined") localStorage.setItem(this._storageKey, JSON.stringify(this._buffer.slice(-50))); } catch {}
  }

  hydrate() {
    try { if (typeof localStorage !== "undefined") { const stored = localStorage.getItem(this._storageKey); if (stored) this._buffer = JSON.parse(stored); } } catch { this._buffer = []; }
  }
}

export const createTelemetrySink = (options = {}) => { const sink = new TelemetrySink(options); sink.hydrate(); return sink; };

export const validateTelemetryEvent = (event) => {
  if (!event || typeof event !== "object") return { valid: false, error: "Event must be an object" };
  if (!event.type || typeof event.type !== "string") return { valid: false, error: "Event must have a type string" };
  if (!event.timestamp || typeof event.timestamp !== "string") return { valid: false, error: "Event must have a timestamp string" };
  const validTypes = Object.values(TELEMETRY_EVENT_TYPES);
  if (!validTypes.includes(event.type)) return { valid: false, error: `Unknown event type: ${event.type}` };
  return { valid: true };
};
