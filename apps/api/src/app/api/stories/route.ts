import { StoryCreateSchema } from "@primer/schemas";
import { createStoryInstance, listStoriesForChild } from "@/lib/mock-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const childId = url.searchParams.get("childId") ?? "";
  return Response.json({ stories: listStoriesForChild(childId) });
}

export async function POST(request: Request) {
  const body = StoryCreateSchema.parse(await request.json());
  const story = createStoryInstance(body);
  return Response.json({ story });
}
