import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ActionLink, InfoCard, LearnerScreen } from "../components/LearnerScreen";
import { listLearnerProfiles, upsertLearnerProfile } from "../store";
import type { LocalChildProfile } from "@primer/local-storage";

const demoProfiles: LocalChildProfile[] = [
  {
    id: "child_mia",
    displayName: "Mia",
    birthDate: "2019-03-05T00:00:00.000Z",
    ageBand: "6-7",
    schoolYear: "Year 1",
    accessibilitySettingsJson: {},
    permissionsJson: { homeworkHelpEnabled: true },
    createdAt: "2026-03-01T00:00:00.000Z"
  },
  {
    id: "child_arya",
    displayName: "Aria",
    birthDate: "2018-09-14T00:00:00.000Z",
    ageBand: "8-9",
    schoolYear: "Year 4",
    accessibilitySettingsJson: {},
    permissionsJson: { homeworkHelpEnabled: false },
    createdAt: "2026-03-02T00:00:00.000Z"
  }
];

export default function HomeScreen() {
  const [profiles, setProfiles] = useState<LocalChildProfile[]>([]);

  useEffect(() => {
    const existingProfiles = listLearnerProfiles();

    if (existingProfiles.length === 0) {
      demoProfiles.forEach((profile) => upsertLearnerProfile(profile));
      setProfiles(listLearnerProfiles());
      return;
    }

    setProfiles(existingProfiles);
  }, []);

  return (
    <LearnerScreen
      eyebrow="Profile chooser"
      title="Pick who is learning"
      description="Learner profiles stay local to this device. On web, they stay in this browser."
    >
      {profiles.length === 0 ? <Text style={styles.loading}>Loading local profiles…</Text> : null}

      {profiles.map((profile) => (
        <InfoCard key={profile.id} title={profile.displayName}>
          <Text style={styles.cardBody}>
            {profile.schoolYear} · age band {profile.ageBand}
          </Text>
          <Text style={styles.cardBody}>Local profile ID {profile.id}</Text>
          <View style={styles.actions}>
            <ActionLink href={{ pathname: "/home", params: { childId: profile.id } }} label="Open learner home" />
            <ActionLink
              href={{ pathname: "/assessment", params: { childId: profile.id, subject: "reading" } }}
              label="Start baseline assessment"
              tone="secondary"
            />
          </View>
        </InfoCard>
      ))}
    </LearnerScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    color: "#4b5563",
    fontSize: 16,
    marginBottom: 16
  },
  cardBody: {
    color: "#4b5563",
    fontSize: 16,
    lineHeight: 22
  },
  actions: {
    gap: 12,
    marginTop: 16
  }
});
