import { describe, expect, it } from "vitest";
import { listCurriculumNodes, selectNextNode, selectRemediationNode } from "../src";

describe("curriculum-engine", () => {
  it("filters nodes by subject and age band", () => {
    const nodes = listCurriculumNodes("reading", "6-7");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.id).toBe("reading-6-7-cvc-words");
  });

  it("selects the next node using mastery threshold", () => {
    const node = selectNextNode({
      subject: "maths",
      ageBand: "6-7",
      masteryMap: {
        "maths-6-7-add-within-10": 0.6
      }
    });
    expect(node?.id).toBe("maths-6-7-add-within-10");
  });

  it("selects remediation when mastery is below 0.5", () => {
    const node = selectRemediationNode({
      subject: "reading",
      ageBand: "6-7",
      masteryMap: {
        "reading-6-7-cvc-words": 0.4
      }
    });
    expect(node?.id).toBe("reading-6-7-cvc-words");
  });
});
