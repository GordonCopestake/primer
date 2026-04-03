import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { designTokens } from "@primer/design-tokens";

type LearnerScreenProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

type InfoCardProps = {
  title: string;
  children: ReactNode;
};

type ActionLinkProps = {
  href: Href;
  label: string;
  tone?: "primary" | "secondary";
};

export function LearnerScreen({ eyebrow, title, description, children }: LearnerScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.sunGlow} />
      <View style={styles.skyGlow} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

export function InfoCard({ title, children }: InfoCardProps) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      <View style={styles.infoCardBody}>{children}</View>
    </View>
  );
}

export function ActionLink({ href, label, tone = "primary" }: ActionLinkProps) {
  return (
    <Link href={href} asChild>
      <Pressable style={[styles.actionLink, tone === "primary" ? styles.primaryAction : styles.secondaryAction]}>
        <Text style={[styles.actionLabel, tone === "primary" ? styles.primaryLabel : styles.secondaryLabel]}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: designTokens.color.paper
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32
  },
  card: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 720,
    borderRadius: designTokens.radius.card,
    backgroundColor: "#ffffff",
    padding: 24,
    shadowColor: "#1f2937",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
    gap: 16
  },
  eyebrow: {
    color: "#6b4e2e",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  title: {
    color: designTokens.color.ink,
    fontSize: designTokens.typography.display,
    fontWeight: "800",
    lineHeight: 38
  },
  description: {
    color: "#4b5563",
    fontSize: designTokens.typography.body,
    lineHeight: 24
  },
  infoCard: {
    borderRadius: designTokens.radius.card,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    gap: 8
  },
  infoCardTitle: {
    color: designTokens.color.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  infoCardBody: {
    gap: 8
  },
  actionLink: {
    minHeight: 48,
    borderRadius: designTokens.radius.button,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1
  },
  primaryAction: {
    backgroundColor: "#1f2937",
    borderColor: "#1f2937"
  },
  secondaryAction: {
    backgroundColor: "#fffdf7",
    borderColor: "#d1d5db"
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "700"
  },
  primaryLabel: {
    color: "#ffffff"
  },
  secondaryLabel: {
    color: designTokens.color.ink
  },
  sunGlow: {
    position: "absolute",
    right: -56,
    top: -56,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: "#fde68a",
    opacity: 0.45
  },
  skyGlow: {
    position: "absolute",
    left: -72,
    bottom: 40,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "#dbeafe",
    opacity: 0.5
  }
});
