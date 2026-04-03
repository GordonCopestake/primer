import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ActionLink, InfoCard, LearnerScreen } from "../components/LearnerScreen";
import { advanceLocalStoryCheckpoint, createLocalStoryInstance } from "../lib/story";
import { getLearnerProfile, listStoryInstances } from "../store";

function resolveChildId(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
}

type StoryChoice = {
  id: string;
  label: string;
};

export default function StoryScreen() {
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = resolveChildId(params.childId);
  const profile = childId ? getLearnerProfile(childId) : null;
  const existingStoryCount = profile ? listStoryInstances(profile.id).length : 0;
  const [storyState, setStoryState] = useState(() => {
    if (!profile) {
      return null;
    }

    return createLocalStoryInstance({
      childProfile: profile
    });
  });

  if (!profile) {
    return (
      <LearnerScreen
        eyebrow="Story mode"
        title="Select a learner first"
        description="Story mode needs a learner profile so it can choose a local curriculum target and save checkpoints on device."
      >
        <ActionLink href="/" label="Back to profile chooser" />
      </LearnerScreen>
    );
  }

  const story = storyState?.story;
  const branchState = story?.branchStateJson as { latestSegment?: string; choices?: StoryChoice[]; path?: string[] } | undefined;
  const choices = Array.isArray(branchState?.choices) ? branchState.choices : [];
  const path = Array.isArray(branchState?.path) ? branchState.path : [];
  const completed = Boolean(story?.progressJson.completed);

  function handleChoice(choiceId: string) {
    if (!profile || !story) {
      return;
    }

    const nextState = advanceLocalStoryCheckpoint({
      childProfile: profile,
      story,
      choiceId
    });

    setStoryState(nextState);
  }

  return (
    <LearnerScreen
      eyebrow="Story mode"
      title={story?.title ?? "Story mode"}
      description="This story loop picks a local learning target, saves each checkpoint on device, and falls back to safer text if a story segment needs it."
    >
      <InfoCard title="Story scene">
        <Text style={styles.body}>{branchState?.latestSegment ?? "No story scene is ready yet."}</Text>
      </InfoCard>

      <InfoCard title="Progress">
        <Text style={styles.body}>Checkpoint: {typeof story?.progressJson.checkpoint === "number" ? story.progressJson.checkpoint : 0}</Text>
        <Text style={styles.body}>Previous local story saves: {existingStoryCount}</Text>
        <Text style={styles.meta}>Choice path: {path.length ? path.join(" -> ") : "No choices yet"}</Text>
      </InfoCard>

      <InfoCard title={completed ? "Story complete" : "Choose the next path"}>
        {completed ? (
          <Text style={styles.body}>This story reached its final checkpoint. Start another session or head back home.</Text>
        ) : (
          choices.map((choice) => (
            <Pressable key={choice.id} style={styles.choiceButton} onPress={() => handleChoice(choice.id)}>
              <Text style={styles.choiceLabel}>{choice.label}</Text>
            </Pressable>
          ))
        )}
      </InfoCard>

      <View style={styles.actions}>
        <ActionLink href={{ pathname: "/home", params: { childId: profile.id } }} label="Back to home" tone="secondary" />
      </View>
    </LearnerScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: "#4b5563",
    fontSize: 16,
    lineHeight: 22
  },
  meta: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20
  },
  choiceButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#1f2937"
  },
  choiceLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },
  actions: {
    gap: 12
  }
});
