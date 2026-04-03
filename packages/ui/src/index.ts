import type { ReactNode } from "react";
import { createElement, Fragment } from "react";

export type Tone = "primary" | "secondary" | "neutral";

export interface ButtonProps {
  children: ReactNode;
  tone?: Tone;
}

export function Button({ children, tone = "primary" }: ButtonProps) {
  return createElement("button", { "data-tone": tone }, children);
}

export interface CardProps {
  title: string;
  children: ReactNode;
}

export function Card({ title, children }: CardProps) {
  return createElement("section", { "data-card": title }, [createElement("h2", { key: "title" }, title), children]);
}

export interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return createElement("progress", { value, max: 100, "aria-label": "progress" });
}

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return createElement("div", { "data-empty-state": title }, [title, subtitle ?? ""]);
}

export interface PermissionGateProps {
  allowed: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ allowed, children, fallback = null }: PermissionGateProps) {
  return allowed ? createElement(Fragment, null, children) : createElement(Fragment, null, fallback);
}
