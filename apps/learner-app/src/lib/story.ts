import { listCurriculumNodes, selectNextNode } from "@primer/curriculum-engine";
import { reviewStoryContent } from "@primer/safety-engine";
import type { LocalChildProfile, LocalLearnerState, LocalStoryInstance } from "@primer/local-storage";
import type { CurriculumNode, Subject } from "@primer/types";
import { getLearnerState, upsertStoryInstance } from "../store";

type StoryChoice = {
  id: string;
  label: string;
};

type StoryCheckpoint = {
  id: string;
  prompt: string;
  choices: StoryChoice[];
};

type StoryBranchState = {
  path: string[];
  latestSegment: string;
  choices: StoryChoice[];
};

const storyCheckpoints: StoryCheckpoint[] = [
  {
    id: "checkpoint_0",
    prompt: "A learning lantern flickers at the start of the trail. Which clue should the learner follow first?",
    choices: [
      { id: "look_closer", label: "Look closer" },
      { id: "ask_for_hint", label: "Ask for a hint" }
    ]
  },
  {
    id: "checkpoint_1",
    prompt: "The map points to a challenge. Which strategy should guide the next step?",
    choices: [
      { id: "try_it_out", label: "Try it out" },
      { id: "say_it_aloud", label: "Say it aloud" }
    ]
  },
  {
    id: "checkpoint_2",
    prompt: "The final gate opens with a quick reflection. What should the learner do before celebrating?",
    choices: [
      { id: "check_answer", label: "Check the answer" },
      { id: "teach_back", label: "Teach it back" }
    ]
  }
];

type StoryStateBundle = {
  learnerState: LocalLearnerState;
  targetNode: CurriculumNode;
  story: LocalStoryInstance;
};

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getStoryTargetNode(childProfile: LocalChildProfile, learnerState: LocalLearnerState): CurriculumNode {
  const recommendedNode = selectNextNode({
    subject: learnerState.subject,
    ageBand: childProfile.ageBand,
    masteryMap: learnerState.masteryMapJson
  });

  return recommendedNode ?? listCurriculumNodes(learnerState.subject, childProfile.ageBand)[0]!;
}

function buildStoryTitle(targetNode: CurriculumNode) {
  return `Lantern Quest: ${targetNode.title}`;
}

function buildSegment(targetNode: CurriculumNode, checkpoint: StoryCheckpoint, path: string[]) {
  const lastChoice = path[path.length - 1];
  const choiceText = lastChoice ? ` The learner just chose "${lastChoice.replace(/_/g, " ")}".` : "";
  return `${targetNode.title} leads the story today. ${checkpoint.prompt}${choiceText}`;
}

function toStoryBranchState(input: {
  latestSegment: string;
  choices: StoryChoice[];
  path: string[];
}): StoryBranchState {
  return {
    latestSegment: input.latestSegment,
    choices: input.choices,
    path: input.path
  };
}

function getCheckpoint(checkpointIndex: number) {
  return storyCheckpoints[Math.min(checkpointIndex, storyCheckpoints.length - 1)];
}

function getCheckpointIndex(story: LocalStoryInstance) {
  const raw = story.progressJson.checkpoint;
  return typeof raw === "number" ? raw : 0;
}

export function createLocalStoryInstance(params: {
  childProfile: LocalChildProfile;
  subject?: Subject;
}): StoryStateBundle {
  const subject = params.subject ?? "reading";
  const learnerState = getLearnerState(params.childProfile.id, subject);
  const targetNode = getStoryTargetNode(params.childProfile, learnerState);
  const checkpoint = getCheckpoint(0);
  const rawSegment = buildSegment(targetNode, checkpoint, []);
  const safety = reviewStoryContent({
    ageBand: params.childProfile.ageBand,
    title: buildStoryTitle(targetNode),
    segmentText: rawSegment
  });
  const now = new Date().toISOString();
  const story: LocalStoryInstance = {
    id: makeId("story"),
    childProfileId: params.childProfile.id,
    curriculumNodeId: targetNode.id,
    title: safety.fallbackTitle,
    branchStateJson: toStoryBranchState({
      latestSegment: safety.fallbackSegment,
      choices: checkpoint.choices,
      path: []
    }),
    progressJson: {
      checkpoint: 0,
      completed: false
    },
    createdAt: now,
    updatedAt: now
  };

  return {
    learnerState,
    targetNode,
    story: upsertStoryInstance(story)
  };
}

export function advanceLocalStoryCheckpoint(params: {
  childProfile: LocalChildProfile;
  story: LocalStoryInstance;
  choiceId: string;
  subject?: Subject;
}): StoryStateBundle {
  const subject = params.subject ?? "reading";
  const learnerState = getLearnerState(params.childProfile.id, subject);
  const targetNode = getStoryTargetNode(params.childProfile, learnerState);
  const currentPath = Array.isArray(params.story.branchStateJson.path)
    ? params.story.branchStateJson.path.filter((value): value is string => typeof value === "string")
    : [];
  const nextPath = [...currentPath, params.choiceId];
  const nextCheckpointIndex = getCheckpointIndex(params.story) + 1;
  const completed = nextCheckpointIndex >= storyCheckpoints.length;
  const activeCheckpoint = getCheckpoint(nextCheckpointIndex);
  const rawSegment = completed
    ? `${targetNode.title} is complete. The learner used ${nextPath.length} brave choices and reached the final page.`
    : buildSegment(targetNode, activeCheckpoint, nextPath);
  const safety = reviewStoryContent({
    ageBand: params.childProfile.ageBand,
    title: params.story.title,
    segmentText: rawSegment
  });
  const nextStory: LocalStoryInstance = {
    ...params.story,
    branchStateJson: toStoryBranchState({
      latestSegment: safety.fallbackSegment,
      choices: completed ? [] : activeCheckpoint.choices,
      path: nextPath
    }),
    progressJson: {
      checkpoint: Math.min(nextCheckpointIndex, storyCheckpoints.length),
      completed
    },
    updatedAt: new Date().toISOString()
  };

  return {
    learnerState,
    targetNode,
    story: upsertStoryInstance(nextStory)
  };
}
