import { listCurriculumNodes } from "@primer/curriculum-engine";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subject = url.searchParams.get("subject") as "reading" | "maths" | "science" | null;
  const ageBand = url.searchParams.get("ageBand") as "4-5" | "6-7" | "8-9" | "10-11" | null;
  return Response.json({
    nodes: listCurriculumNodes(subject ?? undefined, ageBand ?? undefined)
  });
}
