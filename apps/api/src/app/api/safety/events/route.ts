import { listSafetyEventsForChild } from "@/lib/mock-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const childId = url.searchParams.get("childId") ?? "";
  return Response.json({ events: listSafetyEventsForChild(childId) });
}
