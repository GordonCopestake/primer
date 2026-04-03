import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ActionLink, InfoCard, LearnerScreen } from "../components/LearnerScreen";
import { getLearnerProfile, getLearnerState } from "../store";

function resolveChildId(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
}

export default function ProgressScreen() {
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = resolveChildId(params.childId);
  const profile = childId ? getLearnerProfile(childId) : null;

  return (
    <LearnerScreen
      eyebrow="Progress"
      title="Local progress snapshot"
      description="Progress will be read from learner state and shown on-device."
    >
      <InfoCard title={profile ? profile.displayName : "No learner selected"}>
        {profile ? (
          <>
            <Text style={styles.body}>Current age band {profile.ageBand}</Text>
            <Text style={styles.body}>
              Reading mastery entries: {Object.keys(getLearnerState(profile.id, "reading").masteryMapJson).length}
            </Text>
          </>
        ) : (
          <Text style={styles.body}>Choose a learner to see local progress.</Text>
        )}
      </InfoCard>

      <View style={styles.actions}>
        <ActionLink href={childId ? { pathname: "/home", params: { childId } } : "/"} label="Back to home" />
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
