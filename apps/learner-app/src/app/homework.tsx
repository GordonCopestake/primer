import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ActionLink, InfoCard, LearnerScreen } from "../components/LearnerScreen";
import { parseLocalHomeworkArtifact } from "../lib/homework";
import { getLearnerProfile, listHomeworkArtifacts } from "../store";

function resolveChildId(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
}

export default function HomeworkScreen() {
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = resolveChildId(params.childId);
  const profile = childId ? getLearnerProfile(childId) : null;
  const [sourceType, setSourceType] = useState<"text" | "image">("text");
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<ReturnType<typeof parseLocalHomeworkArtifact> | null>(null);

  if (!profile) {
    return (
      <LearnerScreen
        eyebrow="Homework help"
        title="Select a learner first"
        description="Homework help needs a learner profile so it can save the artifact and guided solve steps on this device."
      >
        <ActionLink href="/" label="Back to profile chooser" />
      </LearnerScreen>
    );
  }

  const learnerProfile = profile;
  const artifactCount = listHomeworkArtifacts(learnerProfile.id).length;

  function handleParse() {
    const next = parseLocalHomeworkArtifact({
      childProfile: learnerProfile,
      sourceType,
      extractedText: draft,
      blobUrl: sourceType === "image" ? "local-image-placeholder" : ""
    });

    setResult(next);
  }

  return (
    <LearnerScreen
      eyebrow="Homework help"
      title={`${learnerProfile.displayName} · homework help`}
      description="This flow captures a homework prompt locally, parses it on device, and turns it into a step-by-step solve plan."
    >
      <InfoCard title="Capture source">
        <View style={styles.sourceRow}>
          <Pressable
            style={[styles.toggleButton, sourceType === "text" ? styles.activeToggle : styles.inactiveToggle]}
            onPress={() => setSourceType("text")}
          >
            <Text style={[styles.toggleLabel, sourceType === "text" ? styles.activeToggleLabel : styles.inactiveToggleLabel]}>Text</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, sourceType === "image" ? styles.activeToggle : styles.inactiveToggle]}
            onPress={() => setSourceType("image")}
          >
            <Text style={[styles.toggleLabel, sourceType === "image" ? styles.activeToggleLabel : styles.inactiveToggleLabel]}>Image</Text>
          </Pressable>
        </View>
        <Text style={styles.meta}>
          Local multimodal enabled: no. Image mode currently stores a local placeholder and uses extracted text fallback.
        </Text>
      </InfoCard>

      <InfoCard title="Problem input">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={sourceType === "image" ? "Paste the extracted text from the image" : "Paste the homework problem"}
          placeholderTextColor="#9ca3af"
          style={styles.input}
          multiline
        />
        <Pressable style={styles.primaryButton} onPress={handleParse}>
          <Text style={styles.primaryButtonLabel}>Parse and guide</Text>
        </Pressable>
        <Text style={styles.meta}>Saved local homework artifacts: {artifactCount}</Text>
      </InfoCard>

      {result ? (
        <>
          <InfoCard title="Parsed artifact">
            <Text style={styles.body}>Problem type: {String(result.artifact.parsedStructureJson.problemType)}</Text>
            <Text style={styles.body}>Extracted text: {result.artifact.extractedText || "No text available"}</Text>
            <Text style={styles.meta}>
              Confidence: {String(result.artifact.parsedStructureJson.confidence)} {result.usedSafetyFallback ? "· safety fallback used" : ""}
            </Text>
          </InfoCard>

          <InfoCard title="Guided solve">
            {result.guidance.map((line) => (
              <Text key={line} style={styles.body}>
                {line}
              </Text>
            ))}
          </InfoCard>
        </>
      ) : null}

      <View style={styles.actions}>
        <ActionLink href={{ pathname: "/home", params: { childId: learnerProfile.id } }} label="Back to home" tone="secondary" />
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
  sourceRow: {
    flexDirection: "row",
    gap: 12
  },
  toggleButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  activeToggle: {
    backgroundColor: "#1f2937",
    borderColor: "#1f2937"
  },
  inactiveToggle: {
    backgroundColor: "#fffdf7",
    borderColor: "#d1d5db"
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "700"
  },
  activeToggleLabel: {
    color: "#ffffff"
  },
  inactiveToggleLabel: {
    color: "#1f2937"
  },
  input: {
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111827",
    fontSize: 16,
    textAlignVertical: "top",
    backgroundColor: "#ffffff"
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#1f2937"
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },
  actions: {
    gap: 12
  }
});
