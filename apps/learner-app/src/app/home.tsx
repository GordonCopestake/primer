import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ActionLink, InfoCard, LearnerScreen } from "../components/LearnerScreen";
import { getLearnerProfile, getLearnerState } from "../store";
import { buildBaselineAssessmentPlan } from "../lib/assessment";

function resolveChildId(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
}

export default function HomeScreen() {
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = resolveChildId(params.childId);
  const profile = childId ? getLearnerProfile(childId) : null;

  if (!profile) {
    return (
      <LearnerScreen
        eyebrow="Child home"
        title="No learner selected"
        description="Choose a local profile first so the learner app can load the right progress."
      >
        <ActionLink href="/" label="Back to profile chooser" />
      </LearnerScreen>
    );
  }

  const readingState = getLearnerState(profile.id, "reading");
  const plan = buildBaselineAssessmentPlan({
    childProfile: profile,
    learnerState: readingState,
    subject: "reading"
  });

  return (
    <LearnerScreen
      eyebrow="Child home"
      title={`Ready for ${profile.displayName}`}
      description="This screen keeps the session flow short: choose an activity, then continue from local learner state."
    >
      <InfoCard title="Today’s starting point">
        <Text style={styles.body}>Age band {profile.ageBand}</Text>
        <Text style={styles.body}>School year {profile.schoolYear}</Text>
        <Text style={styles.body}>
          Recommended reading skill: {plan.recommendedNode?.title ?? "No open reading skill right now"}
        </Text>
        <Text style={styles.body}>
          Reading mastery entries: {Object.keys(readingState.masteryMapJson).length}
        </Text>
      </InfoCard>

      <View style={styles.actions}>
        <ActionLink href={{ pathname: "/assessment", params: { childId: profile.id, subject: "reading" } }} label="Start baseline assessment" />
        <ActionLink href={{ pathname: "/session", params: { childId: profile.id } }} label="Open session shell" tone="secondary" />
        <ActionLink href={{ pathname: "/story", params: { childId: profile.id } }} label="Story mode" tone="secondary" />
        <ActionLink href={{ pathname: "/homework", params: { childId: profile.id } }} label="Homework help" tone="secondary" />
        <ActionLink href={{ pathname: "/progress", params: { childId: profile.id } }} label="View progress" tone="secondary" />
        <ActionLink href={{ pathname: "/settings", params: { childId: profile.id } }} label="Learner settings" tone="secondary" />
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
  }
});
