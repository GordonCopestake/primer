import { SessionTurnCreateSchema } from "@primer/schemas";
import { submitSessionTurn } from "@/lib/mock-store";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = SessionTurnCreateSchema.parse(await request.json());
  const result = submitSessionTurn({
    sessionId: id,
    inputType: body.inputType,
    content: typeof body.content === "string" ? { text: body.content } : body.content
  });

  return Response.json(result);
}
