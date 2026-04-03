import { getChildHome } from "@/lib/mock-store";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  return Response.json(getChildHome(id));
}
