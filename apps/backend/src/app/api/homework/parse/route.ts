import { HomeworkParseSchema } from "@primer/schemas";
import { parseHomeworkArtifact } from "@/lib/mock-store";

export async function POST(request: Request) {
  const body = HomeworkParseSchema.parse(await request.json());
  return Response.json({
    artifact: parseHomeworkArtifact({
      childId: body.childId,
      sourceType: body.sourceType,
      blobUrl: body.blobUrl,
      extractedText: body.extractedText
    })
  });
}
