/**
 * Copies large-widget Sprout stage PNGs into the widget extension xcassets.
 * Source: assets/widgets/ios/large/Sprout-stages/
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcDir = path.join(root, "assets", "widgets", "ios", "large", "Sprout-stages");
const xcassets = path.join(root, "targets", "widget", "Assets.xcassets");

const sets = [
  ["Sprout-quiet.png", "SproutQuiet.imageset", "SproutQuiet.png"],
  ["Sprout-growing.png", "SproutGrowing.imageset", "SproutGrowing.png"],
  ["Sprout-thriving.png", "SproutThriving.imageset", "SproutThriving.png"],
];

const contentsJson = (filename) =>
  JSON.stringify(
    {
      images: [
        { idiom: "universal", scale: "1x", filename },
        { idiom: "universal", scale: "2x", filename },
        { idiom: "universal", scale: "3x", filename },
      ],
      info: { version: 1, author: "grove" },
    },
    null,
    2
  );

for (const [srcName, setName, destName] of sets) {
  const src = path.join(srcDir, srcName);
  const destDir = path.join(xcassets, setName);
  const dest = path.join(destDir, destName);
  if (!fs.existsSync(src)) {
    console.warn(`sync-widget-sprout-stages: skip missing ${src}`);
    continue;
  }
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  fs.writeFileSync(path.join(destDir, "Contents.json"), contentsJson(destName), "utf8");
}
console.log("sync-widget-sprout-stages: done");
