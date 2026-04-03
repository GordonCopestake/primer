import { PrivacyRequestSchema } from "@primer/schemas";
import { requestPrivacyOperation } from "@/lib/mock-store";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url);
  const parentAccountId = url.searchParams.get("parentAccountId") ?? "";
  const reason = url.searchParams.get("reason") ?? undefined;
  const body = PrivacyRequestSchema.parse({ parentAccountId, reason });
  const requestRecord = requestPrivacyOperation({
    childId: params.id,
    parentAccountId: body.parentAccountId,
    reason: body.reason,
    requestType: "export"
  });

  return Response.json({ request: requestRecord });
}
