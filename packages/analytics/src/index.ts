export const analyticsEvents = [
  "session_started",
  "session_completed",
  "hint_used",
  "homework_uploaded",
  "story_completed",
  "safety_event_created",
  "parent_reviewed_event",
  "settings_changed"
] as const;

export type AnalyticsEventName = (typeof analyticsEvents)[number];

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return (analyticsEvents as readonly string[]).includes(value);
}
