import { getChildHome } from "@/lib/mock-store";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  return Response.json({
    childId: id,
    status: "started",
    home: getChildHome(id)
  });
}
