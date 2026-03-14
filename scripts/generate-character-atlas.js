/**
 * Builds a single sprite sheet (character-atlas.png) from individual frame PNGs.
 * Layout: 6 columns × 9 rows (one row per animation). Cell size 96×96.
 * Run: node scripts/generate-character-atlas.js
 */

const path = require("path");
const fs = require("fs");

const CELL = 96;
const COLS = 6;
const ROWS = 9;
const ATLAS_W = COLS * CELL;
const ATLAS_H = ROWS * CELL;

// Same order as game.tsx AnimKey: idle, north, south, east, west, north-east, north-west, south-east, south-west
const ANIM_ROWS = [
  { key: "idle", dir: "breathing-idle/south", frames: 4 },
  { key: "north", dir: "walking/north", frames: 6 },
  { key: "south", dir: "walking/south", frames: 6 },
  { key: "east", dir: "walking/east", frames: 6 },
  { key: "west", dir: "walking/west", frames: 6 },
  { key: "north-east", dir: "walking/north-east", frames: 6 },
  { key: "north-west", dir: "walking/north-west", frames: 6 },
  { key: "south-east", dir: "walking/south-east", frames: 6 },
  { key: "south-west", dir: "walking/south-west", frames: 6 },
];

const ROOT = path.resolve(__dirname, "..");
const SPRITES_DIR = path.join(ROOT, "assets", "moving_sprites");
const OUT_PATH = path.join(ROOT, "assets", "game", "character-atlas.png");

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch (e) {
    console.error("Need sharp to build atlas. Run: npm install --save-dev sharp");
    process.exit(1);
  }

  const composites = [];
  for (let row = 0; row < ANIM_ROWS.length; row++) {
    const { dir, frames } = ANIM_ROWS[row];
    for (let col = 0; col < frames; col++) {
      const frameNum = String(col).padStart(3, "0");
      const filePath = path.join(SPRITES_DIR, dir, `frame_${frameNum}.png`);
      if (!fs.existsSync(filePath)) {
        console.warn("Missing:", filePath);
        continue;
      }
      composites.push({
        input: await sharp(filePath).resize(CELL, CELL).toBuffer(),
        left: col * CELL,
        top: row * CELL,
      });
    }
  }

  const base = await sharp({
    create: {
      width: ATLAS_W,
      height: ATLAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  const outDir = path.dirname(OUT_PATH);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await base.composite(composites).png().toFile(OUT_PATH);
  console.log("Wrote", OUT_PATH, `(${ATLAS_W}×${ATLAS_H})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
