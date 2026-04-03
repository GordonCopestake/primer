import { HouseholdCreateSchema } from "@primer/schemas";
import { createHousehold } from "@/lib/mock-store";

export async function POST(request: Request) {
  const body = HouseholdCreateSchema.parse(await request.json());
  const household = createHousehold({
    ownerParentId: body.ownerParentId,
    settingsJson: body.settingsJson
  });

  return Response.json({ household });
}
