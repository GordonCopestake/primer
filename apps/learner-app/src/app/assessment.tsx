import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ActionLink, InfoCard, LearnerScreen } from "../components/LearnerScreen";
import { buildBaselineAssessmentPlan, saveBaselineAssessmentOutcome } from "../lib/assessment";
import { getLearnerProfile, getLearnerState } from "../store";
import type { Subject } from "@primer/types";

function resolveChildId(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
}

function resolveSubject(value: string | string[] | undefined): Subject {
  return value === "maths" ? "maths" : "reading";
}

export default function AssessmentScreen() {
  const params = useLocalSearchParams<{ childId?: string; subject?: string }>();
  const childId = resolveChildId(params.childId);
  const subject = resolveSubject(params.subject);
  const profile = childId ? getLearnerProfile(childId) : null;
  const [learnerState, setLearnerState] = useState(() => {
    if (!profile) {
      return null;
    }

    return getLearnerState(profile.id, subject);
  });
  const [statusMessage, setStatusMessage] = useState("");

  if (!profile) {
    return (
      <LearnerScreen
        eyebrow="Baseline assessment"
        title="Select a learner first"
        description="The baseline assessment uses local learner state, so it needs a selected profile."
      >
        <ActionLink href="/" label="Back to profile chooser" />
      </LearnerScreen>
    );
  }

  const learnerProfile = profile;
  const activeLearnerState = learnerState ?? getLearnerState(learnerProfile.id, subject);
  const plan = useMemo(
    () =>
      buildBaselineAssessmentPlan({
        childProfile: learnerProfile,
        learnerState: activeLearnerState,
        subject
      }),
    [activeLearnerState, learnerProfile, subject]
  );
  const activityType = typeof plan.recommendedNode?.metadataJson.activityType === "string" ? plan.recommendedNode.metadataJson.activityType : "assessment";
  const currentNodeId = plan.recommendedNode?.id ?? plan.remediationNode?.id;

  function handleOutcome(score: number, confidence: number, label: string, misconception?: string) {
    if (!currentNodeId) {
      return;
    }

    const nextState = saveBaselineAssessmentOutcome({
      childProfileId: learnerProfile.id,
      subject,
      nodeId: currentNodeId,
      score,
      confidence,
      misconception
    });

    setLearnerState(nextState);
    setStatusMessage(label);
  }

  return (
    <LearnerScreen
      eyebrow="Baseline assessment"
      title={`${learnerProfile.displayName} · ${subject}`}
      description="This shell chooses a starting skill from local learner state and curriculum fixtures."
    >
      <InfoCard title="Suggested start">
        <Text style={styles.body}>
          {plan.recommendedNode ? plan.recommendedNode.title : "No open skill in this subject yet"}
        </Text>
        <Text style={styles.body}>
          {plan.recommendedNode?.description ?? "The learner is already ahead of the current fixture set."}
        </Text>
        <Text style={styles.body}>
          Mode hint: {activityType}
        </Text>
      </InfoCard>

      {statusMessage ? (
        <InfoCard title="Saved locally">
          <Text style={styles.body}>{statusMessage}</Text>
        </InfoCard>
      ) : null}

      <View style={styles.actions}>
        <ActionLink
          href={{ pathname: "/session", params: { childId: learnerProfile.id } }}
          label="Begin assessment flow"
        />
        {currentNodeId ? (
          <>
            <Pressable style={styles.outcomeButton} onPress={() => handleOutcome(0.92, 0.84, "Recorded as mastered.")}>
              <Text style={styles.outcomeLabel}>Looks mastered</Text>
            </Pressable>
            <Pressable
              style={[styles.outcomeButton, styles.outcomeButtonSecondary]}
              onPress={() => handleOutcome(0.32, 0.55, "Recorded as needs more practice.", "needs more support")}
            >
              <Text style={styles.outcomeLabelSecondary}>Needs more practice</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.body}>All available skills are already mastered for this subject.</Text>
        )}
        <ActionLink href={{ pathname: "/home", params: { childId: learnerProfile.id } }} label="Back to learner home" tone="secondary" />
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
  actions: {
    gap: 12
  },
  outcomeButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#1f2937"
  },
  outcomeButtonSecondary: {
    backgroundColor: "#fffdf7",
    borderWidth: 1,
    borderColor: "#d1d5db"
  },
  outcomeLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },
  outcomeLabelSecondary: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "700"
  }
});
