import { SafetyReviewSchema } from "@primer/schemas";
import { reviewSafetyEvent } from "@/lib/mock-store";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = SafetyReviewSchema.parse(await request.json());
  return Response.json({
    event: reviewSafetyEvent(String(body.childId), id)
  });
}
