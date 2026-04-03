import { ChildCreateSchema } from "@primer/schemas";
import { createChildProfile } from "@/lib/mock-store";

export async function POST(request: Request) {
  const body = ChildCreateSchema.parse(await request.json());
  const child = createChildProfile({
    householdId: body.householdId,
    displayName: body.displayName,
    birthDate: body.birthDate,
    ageBand: body.ageBand,
    schoolYear: body.schoolYear,
    avatarUrl: body.avatarUrl ?? null
  });

  return Response.json({ child });
}
