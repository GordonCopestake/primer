const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Expo workspace imports resolve through the monorepo root, but Metro should not
// try to watch generated app outputs from sibling apps.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules")
];
config.resolver.blockList = exclusionList([
  /.*\/apps\/[^/]+\/\.next\/.*/,
  /.*\/apps\/[^/]+\/\.turbo\/.*/,
  /.*\/apps\/[^/]+\/dist\/.*/,
  /.*\/packages\/[^/]+\/dist\/.*/,
  /.*\/node_modules\/\.cache\/.*/
]);

module.exports = config;
