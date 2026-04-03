import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ActionLink, InfoCard, LearnerScreen } from "../components/LearnerScreen";

function resolveChildId(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
}

export default function SettingsScreen() {
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = resolveChildId(params.childId);

  return (
    <LearnerScreen
      eyebrow="Learner settings"
      title="Simple local settings shell"
      description="Learner settings stay separate from the on-device parent area."
    >
      <InfoCard title="What stays here">
        <Text style={styles.body}>Accessibility preferences</Text>
        <Text style={styles.body}>Learning mode preferences</Text>
        <Text style={styles.body}>Browser-only storage note for web fallback</Text>
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
