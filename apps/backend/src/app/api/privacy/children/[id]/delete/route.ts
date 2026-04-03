import { PrivacyRequestSchema } from "@primer/schemas";
import { requestPrivacyOperation } from "@/lib/mock-store";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = PrivacyRequestSchema.parse(await request.json());
  const requestRecord = requestPrivacyOperation({
    childId: params.id,
    parentAccountId: body.parentAccountId,
    reason: body.reason,
    requestType: "delete"
  });

  return Response.json({ request: requestRecord });
}
