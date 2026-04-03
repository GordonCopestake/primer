import { ConsentRecordSchema } from "@primer/schemas";
import { captureParentalConsent } from "@/lib/mock-store";

export async function POST(request: Request) {
  const body = ConsentRecordSchema.parse(await request.json());
  const consent = captureParentalConsent(body);
  return Response.json({ consent });
}
