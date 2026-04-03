/**
 * Copies small-widget PNGs from assets/widgets/ios/small into the widget extension xcassets.
 * Run after updating art in small/ (see assets/widgets/ios/README.md).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const smallDir = path.join(root, "assets", "widgets", "ios", "small");
const xcassets = path.join(root, "targets", "widget", "Assets.xcassets");

const pairs = [
  ["Sprout-small.png", "SproutSmall.imageset", "SproutSmall.png"],
  ["habit-progress-icon.png", "habitProgressIcon.imageset", "habitProgressIcon.png"],
];

for (const [srcName, setName, destName] of pairs) {
  const src = path.join(smallDir, srcName);
  const destDir = path.join(xcassets, setName);
  const dest = path.join(destDir, destName);
  if (!fs.existsSync(src)) {
    console.warn(`sync-widget-small-assets: skip missing ${src}`);
    continue;
  }
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}
console.log("sync-widget-small-assets: done");
