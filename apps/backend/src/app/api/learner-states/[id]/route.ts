import { SubjectSchema } from "@primer/schemas";
import { getLearnerState } from "@/lib/mock-store";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url);
  const subject = SubjectSchema.parse(url.searchParams.get("subject") ?? "reading");
  return Response.json({ learnerState: getLearnerState(params.id, subject) });
}
