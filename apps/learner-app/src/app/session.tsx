import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ActionLink, InfoCard, LearnerScreen } from "../components/LearnerScreen";
import { createLocalSessionTranscript, submitLocalSessionTurn } from "../lib/session";
import { getLearnerProfile, listSessionTranscripts } from "../store";
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

export default function SessionScreen() {
  const params = useLocalSearchParams<{ childId?: string; subject?: string }>();
  const childId = resolveChildId(params.childId);
  const subject = resolveSubject(params.subject);
  const profile = childId ? getLearnerProfile(childId) : null;
  const existingTranscriptCount = profile ? listSessionTranscripts(profile.id).length : 0;
  const [draft, setDraft] = useState("");
  const [sessionState, setSessionState] = useState(() => {
    if (!profile) {
      return null;
    }

    return createLocalSessionTranscript({
      childProfile: profile,
      subject
    });
  });
  const [statusMessage, setStatusMessage] = useState("");

  if (!profile) {
    return (
      <LearnerScreen
        eyebrow="Session flow"
        title="Select a learner first"
        description="A tutoring session needs a learner profile so it can choose the next local curriculum target."
      >
        <ActionLink href="/" label="Back to profile chooser" />
      </LearnerScreen>
    );
  }

  const transcript = sessionState?.transcript;
  const targetNode = sessionState?.targetNode;
  function handleSubmit() {
    if (!profile || !sessionState) {
      return;
    }

    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    const result = submitLocalSessionTurn({
      childProfile: profile,
      subject,
      sessionId: sessionState.sessionId,
      turns: sessionState.transcript.turns,
      childText: trimmed
    });

    setSessionState({
      learnerState: result.learnerState,
      sessionId: sessionState.sessionId,
      targetNode: result.targetNode,
      transcript: result.transcript
    });
    setDraft("");
    setStatusMessage(
      result.orchestration.meta.usedFallback
        ? `Safe fallback used: ${result.orchestration.meta.fallbackReason ?? "local safety review"}`
        : `Routing: ${result.orchestration.meta.routing.mode}`
    );
  }

  return (
    <LearnerScreen
      eyebrow="Session flow"
      title={`${profile.displayName} · ${subject}`}
      description="This guided session runs the tutor orchestrator locally, saves transcript turns on device, and surfaces routing decisions."
    >
      <InfoCard title="Current target">
        <Text style={styles.body}>{targetNode?.title ?? "No target available"}</Text>
        <Text style={styles.body}>
          {targetNode?.description ?? "The current fixture set has no open node for this learner."}
        </Text>
        <Text style={styles.meta}>Saved session transcripts: {existingTranscriptCount}</Text>
      </InfoCard>

      <InfoCard title="Transcript">
        {transcript?.turns.length ? (
          transcript.turns.map((turn) => (
            <View key={`${turn.createdAt}_${turn.actor}`} style={styles.turnRow}>
              <Text style={styles.turnActor}>{turn.actor === "child" ? profile.displayName : "Primer"}</Text>
              <Text style={styles.body}>{turn.text}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.body}>Start with a short answer or question about this skill.</Text>
        )}
      </InfoCard>

      <InfoCard title="Next turn">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a short learner response"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          multiline
        />
        <Pressable style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryButtonLabel}>Send learner turn</Text>
        </Pressable>
        <Text style={styles.meta}>{statusMessage || "Ready for the first learner response"}</Text>
        <Text style={styles.meta}>{transcript?.summary ?? "No session summary yet."}</Text>
      </InfoCard>

      <View style={styles.actions}>
        <ActionLink href={{ pathname: "/assessment", params: { childId: profile.id, subject } }} label="Back to assessment" tone="secondary" />
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
  turnRow: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10
  },
  turnActor: {
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  input: {
    minHeight: 88,
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
