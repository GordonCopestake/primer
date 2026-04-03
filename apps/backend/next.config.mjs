/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@primer/curriculum-engine",
    "@primer/learner-model",
    "@primer/safety-engine",
    "@primer/schemas",
    "@primer/tutor-orchestrator",
    "@primer/types"
  ]
};

export default nextConfig;
