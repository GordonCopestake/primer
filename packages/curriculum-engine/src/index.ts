import readingBasics from "../data/reading/basics.json";
import mathsNumberSense from "../data/maths/number-sense.json";
import { CurriculumNodeSchema } from "@primer/schemas";
import type { AgeBand, CurriculumNode, Subject } from "@primer/types";

const curriculumNodes: CurriculumNode[] = CurriculumNodeSchema.array().parse([...readingBasics, ...mathsNumberSense]);

export function listCurriculumNodes(subject?: Subject, ageBand?: AgeBand): CurriculumNode[] {
  return curriculumNodes.filter((node) => {
    if (subject && node.subject !== subject) return false;
    if (ageBand && node.ageBand !== ageBand) return false;
    return true;
  });
}

export function getCurriculumNode(nodeId: string): CurriculumNode | undefined {
  return curriculumNodes.find((node) => node.id === nodeId);
}

export function selectNextNode(params: {
  subject: Subject;
  ageBand: AgeBand;
  masteryMap: Record<string, number>;
}): CurriculumNode | undefined {
  const candidates = listCurriculumNodes(params.subject, params.ageBand).sort((a, b) => a.difficulty - b.difficulty);
  return candidates.find((node) => {
    const mastery = params.masteryMap[node.id] ?? 0;
    return mastery < 0.8;
  });
}

export function selectRemediationNode(params: {
  subject: Subject;
  ageBand: AgeBand;
  masteryMap: Record<string, number>;
}): CurriculumNode | undefined {
  const candidates = listCurriculumNodes(params.subject, params.ageBand).sort((a, b) => a.difficulty - b.difficulty);
  return candidates.find((node) => {
    const mastery = params.masteryMap[node.id] ?? 0;
    return mastery < 0.5;
  });
}
