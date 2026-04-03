import { SessionCreateSchema } from "@primer/schemas";
import { startSession } from "@/lib/mock-store";

export async function POST(request: Request) {
  const body = SessionCreateSchema.parse(await request.json());
  const session = startSession(body);
  return Response.json({ session });
}
