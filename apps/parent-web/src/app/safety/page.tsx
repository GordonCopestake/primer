"use client";

import { useEffect, useState } from "react";
import { ParentAreaShell } from "../../features/parent-area";
import { createParentReviewStores, seedParentReviewDemoData } from "../../lib";

const CHILD_ID = "child_local_1";

export default function SafetyPage() {
  const [events, setEvents] = useState<ReturnType<ReturnType<typeof createParentReviewStores>["listSafetyEvents"]>>([]);

  useEffect(() => {
    seedParentReviewDemoData(localStorage, CHILD_ID);
    const stores = createParentReviewStores(localStorage);
    setEvents(stores.listSafetyEvents(CHILD_ID));
  }, []);

  const markReviewed = (eventId: string) => {
    const stores = createParentReviewStores(localStorage);
    stores.markSafetyEventReviewed(eventId);
    setEvents(stores.listSafetyEvents(CHILD_ID));
  };

  return (
    <ParentAreaShell
      title="Safety review"
      description="Review local safety events and follow-up actions on this device."
    >
      {events.length === 0 ? (
        <p>No local safety events found.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <p>
                <strong>{event.type}</strong> · {event.severity} · {event.reviewStatus}
              </p>
              <p>Trigger: {event.triggerExcerpt}</p>
              <p>System action: {event.systemAction}</p>
              {event.reviewStatus === "open" ? (
                <button onClick={() => markReviewed(event.id)} type="button">
                  Mark reviewed
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </ParentAreaShell>
  );
}
