/**
 * Resize and compress select PNGs from assets/Game for faster loading.
 * Outputs to assets/Game/optimized/ (optional; island layout uses full-res paths).
 * Run: npm run optimize-game-assets
 */

const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const GAME = path.join(ROOT, "assets", "Game");
const OUT = path.join(GAME, "optimized");

// Each entry: source path under assets/Game, output filename in optimized/, target size.
const CONFIG = [
  {
    src: "background/Background.png",
    dest: "Background.png",
    width: 727,
    height: 1024,
    description: "background",
  },
  {
    src: "hills/hills.png",
    dest: "hills.png",
    width: 400,
    height: 220,
  },
];

async function main() {
  const sharp = require("sharp");
  if (!fs.existsSync(OUT)) {
    fs.mkdirSync(OUT, { recursive: true });
  }

  for (const { src, dest, width, height, description } of CONFIG) {
    const srcPath = path.join(GAME, src);
    const destPath = path.join(OUT, dest);
    if (!fs.existsSync(srcPath)) {
      console.warn("Skip (missing):", src);
      continue;
    }

    const before = fs.statSync(srcPath).size;
    await sharp(srcPath)
      .resize(width, height, { fit: "fill" })
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(destPath);
    const after = fs.statSync(destPath).size;
    const pct = ((1 - after / before) * 100).toFixed(0);
    console.log(
      `${dest}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB (-${pct}%)${description ? " " + description : ""}`
    );
  }

  console.log("\nOptimized assets written to", path.relative(ROOT, OUT));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
