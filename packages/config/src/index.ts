export const environmentVariables = [
  "DATABASE_URL",
  "REDIS_URL",
  "S3_ENDPOINT",
  "S3_BUCKET",
  "S3_ACCESS_KEY",
  "S3_SECRET_KEY",
  "OPENAI_API_KEY",
  "AUTH_SECRET",
  "NEXT_PUBLIC_API_BASE_URL",
  "SENTRY_DSN",
  "POSTHOG_KEY"
] as const;

export function isEnvironmentVariable(name: string): name is (typeof environmentVariables)[number] {
  return (environmentVariables as readonly string[]).includes(name);
}
