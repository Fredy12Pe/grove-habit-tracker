// @ts-check
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("riv");

const projectRoot = __dirname;

// Metro does not read tsconfig.json "paths" for static require("...") strings.
// Map @/… to absolute files under the project root (same as tsconfig @/* -> ./*).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (typeof moduleName === "string" && moduleName.startsWith("@/")) {
    const fsPath = path.resolve(projectRoot, moduleName.slice(2));
    return context.resolveRequest(context, fsPath, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
