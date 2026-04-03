import { completeSession } from "@/lib/mock-store";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  return Response.json({ session: completeSession(id) });
}
