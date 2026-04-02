const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

/**
 * Patch ExpoWidgetsTarget Swift files to add a widgetURL deep link.
 * This is needed because WidgetKit deep links are configured in Swift via `.widgetURL(...)`.
 */
module.exports = function withWidgetDeepLink(config, props = {}) {
  const url = props.url;
  if (!url) {
    throw new Error(
      "withWidgetDeepLink: missing required prop `url` (e.g. grove:///(tabs)/habits)"
    );
  }

  return withDangerousMod(config, [
    "ios",
    async (mod) => {
      const iosRoot = mod.modRequest.platformProjectRoot;
      const targetDir = path.join(iosRoot, "ExpoWidgetsTarget");
      if (!fs.existsSync(targetDir)) {
        // Target not generated yet (prebuild not run).
        return mod;
      }

      const files = fs
        .readdirSync(targetDir)
        .filter((f) => f.endsWith(".swift") && f !== "index.swift");

      for (const file of files) {
        const p = path.join(targetDir, file);
        let contents = fs.readFileSync(p, "utf8");

        if (contents.includes(".widgetURL(")) continue;

        // Insert widgetURL after supportedFamilies(...) in the WidgetConfiguration chain.
        contents = contents.replace(
          /(\.supportedFamilies\(\[[^\]]+\]\)(?:\s*\n\s*\.contentMarginsDisabled\(\))?)/m,
          `$1\n    .widgetURL(URL(string: "${url}")!)`
        );

        fs.writeFileSync(p, contents);
      }

      return mod;
    },
  ]);
};

