const plantImages = require("./plantImages.generated.js");

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "GroveWidgets",
  displayName: "Grove",
  bundleIdentifier: ".widgets",
  icon: "../../assets/AppIcon.appiconset/icon-ios-1024x1024.png",
  deploymentTarget: "18.0",
  entitlements: {
    "com.apple.security.application-groups": ["group.com.groveHabits.app"],
  },
  colors: {
    $widgetBackground: "#45A427",
    $accent: "#FFFFFF",
    grovePanel: "#F4F3E7",
    groveDotOn: "#88BF25",
    groveDotOff: "#AEBA9B",
  },
  images: plantImages,
});
