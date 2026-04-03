import {
  ChildCreateSchema,
  HouseholdCreateSchema,
  HomeworkParseSchema,
  SafetyReviewSchema,
  SessionCreateSchema,
  SessionTurnCreateSchema
} from "@primer/schemas";

export interface ApiClient {
  createHousehold(payload: unknown): Promise<Response>;
  createChild(payload: unknown): Promise<Response>;
  startSession(payload: unknown): Promise<Response>;
  submitSessionTurn(sessionId: string, payload: unknown): Promise<Response>;
  completeSession(sessionId: string): Promise<Response>;
  parseHomework(payload: unknown): Promise<Response>;
  getChildHome(childId: string): Promise<Response>;
  getProgress(childId: string): Promise<Response>;
  listSafetyEvents(childId: string): Promise<Response>;
  reviewSafetyEvent(childId: string, eventId: string): Promise<Response>;
}

export function createApiClient(baseUrl: string): ApiClient {
  return {
    createHousehold(payload) {
      const parsed = HouseholdCreateSchema.parse(payload);
      return fetch(`${baseUrl}/api/households`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed)
      });
    },
    createChild(payload) {
      const parsed = ChildCreateSchema.parse(payload);
      return fetch(`${baseUrl}/api/children`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed)
      });
    },
    startSession(payload) {
      const parsed = SessionCreateSchema.parse(payload);
      return fetch(`${baseUrl}/api/sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed)
      });
    },
    submitSessionTurn(sessionId, payload) {
      const parsed = SessionTurnCreateSchema.parse(payload);
      return fetch(`${baseUrl}/api/sessions/${sessionId}/turns`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed)
      });
    },
    completeSession(sessionId) {
      return fetch(`${baseUrl}/api/sessions/${sessionId}/complete`, { method: "POST" });
    },
    parseHomework(payload) {
      const parsed = HomeworkParseSchema.parse(payload);
      return fetch(`${baseUrl}/api/homework/parse`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed)
      });
    },
    getChildHome(childId) {
      return fetch(`${baseUrl}/api/children/${childId}/home`);
    },
    getProgress(childId) {
      return fetch(`${baseUrl}/api/reports/children/${childId}/progress`);
    },
    listSafetyEvents(childId) {
      return fetch(`${baseUrl}/api/safety/events?childId=${encodeURIComponent(childId)}`);
    },
    reviewSafetyEvent(childId, eventId) {
      const parsed = SafetyReviewSchema.parse({ childId });
      return fetch(`${baseUrl}/api/safety/events/${eventId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed)
      });
    }
  };
}
