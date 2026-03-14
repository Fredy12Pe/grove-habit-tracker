/**
 * Resize and compress game assets to display size for faster loading.
 * Outputs to assets/game/optimized/ (game.tsx loads from there).
 * Run: npm run optimize-game-assets
 */

const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const GAME = path.join(ROOT, "assets", "game");
const OUT = path.join(GAME, "optimized");

// Display sizes (match game.tsx: SCALE = 1/3, WORLD_W=727, WORLD_H=1024)
const CONFIG = [
  {
    file: "Background.png",
    width: 727,
    height: 1024,
    description: "background (was ~9MB at full res)",
  },
  {
    file: "house.png",
    width: 349,
    height: 310,
  },
  {
    file: "Bushes-top-left.png",
    width: 275,
    height: 127,
  },
  {
    file: "pond.png",
    width: 120,
    height: 77,
  },
  {
    file: "Garden-top-left.png",
    width: 290,
    height: 165,
  },
  {
    file: "Garden-top-right.png",
    width: 290,
    height: 165,
  },
  {
    file: "Garden-Bottom-left.png",
    width: 290,
    height: 165,
  },
  {
    file: "Garden-Bottom-right.png",
    width: 290,
    height: 165,
  },
];

async function main() {
  const sharp = require("sharp");
  if (!fs.existsSync(OUT)) {
    fs.mkdirSync(OUT, { recursive: true });
  }

  for (const { file, width, height, description } of CONFIG) {
    const src = path.join(GAME, file);
    const dest = path.join(OUT, file);
    if (!fs.existsSync(src)) {
      console.warn("Skip (missing):", file);
      continue;
    }

    const before = fs.statSync(src).size;
    await sharp(src)
      .resize(width, height, { fit: "fill" })
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(dest);
    const after = fs.statSync(dest).size;
    const pct = ((1 - after / before) * 100).toFixed(0);
    console.log(
      `${file}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB (-${pct}%)${description ? " " + description : ""}`
    );
  }

  console.log("\nOptimized assets written to", path.relative(ROOT, OUT));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
