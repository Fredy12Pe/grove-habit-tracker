/**
 * Reads PNGs from assets/game/Collision-shapes and outputs lib/game/collisionData.json.
 * Each pixel with alpha > 128 is treated as solid. Run: node scripts/generate-collision-data.js
 */

const fs = require("fs");
const path = require("path");
const getPixels = require("get-pixels");

const ASSETS_DIR = path.join(__dirname, "../assets/game/Collision-shapes");
const OUT_PATH = path.join(__dirname, "../lib/game/collisionData.json");

// World rect (x, y, w, h) for each collision image. Tune these so the grey collision
// overlay aligns with the visible assets (house, pond, gardens, bushes).
// All y values pushed up by 18px.
const LAYERS = [
  { file: "house.png", x: 365, y: 0, w: 349, h: 310 },
  { file: "Bushes-top-left.png", x: 0, y: 0, w: 278, h: 130 },
  { file: "Ellipse 43.png", x: 133, y: 180, w: 124, h: 80 },
  { file: "Garden-top-left.png", x: 4, y: 320, w: 292, h: 167 },
  { file: "Garden-top-right.png", x: 378, y: 320, w: 292, h: 167 },
  { file: "Garden-Bottom-left.png", x: 4, y: 490, w: 292, h: 167 },
  { file: "Garden-Bottom-right.png", x: 378, y: 490, w: 292, h: 167 },
  { file: "Bushes-foreground-left.png", x: -22, y: 718, w: 358, h: 320 },
  { file: "Bushes-foreground-right.png", x: 402, y: 658, w: 352, h: 368 },
];

const CELL_SIZE = 8; // world pixels per grid cell (smaller = more precise, larger JSON)

function loadPixels(filePath) {
  return new Promise((resolve, reject) => {
    getPixels(filePath, (err, pixels) => {
      if (err) reject(err);
      else resolve(pixels);
    });
  });
}

function sampleGrid(pixels, worldW, worldH) {
  const imgW = pixels.shape[0];
  const imgH = pixels.shape[1];
  const gw = Math.ceil(worldW / CELL_SIZE);
  const gh = Math.ceil(worldH / CELL_SIZE);
  const grid = [];
  for (let j = 0; j < gh; j++) {
    const row = [];
    for (let i = 0; i < gw; i++) {
      const px = Math.min(Math.floor((i / gw) * imgW), imgW - 1);
      const py = Math.min(Math.floor((j / gh) * imgH), imgH - 1);
      const r = pixels.get(px, py, 0);
      const g = pixels.get(px, py, 1);
      const b = pixels.get(px, py, 2);
      const alpha = pixels.get(px, py, 3);
      const luminance = (r + g + b) / 3;
      // Solid if: opaque and not black (alpha mask), OR light gray/white (B&W mask e.g. house.png)
      const solid = (alpha > 128 && luminance > 20) || luminance > 128;
      row.push(solid ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}

async function main() {
  const layers = [];
  for (const layer of LAYERS) {
    const filePath = path.join(ASSETS_DIR, layer.file);
    if (!fs.existsSync(filePath)) {
      console.warn("Skip (missing):", layer.file);
      continue;
    }
    const pixels = await loadPixels(filePath);
    const grid = sampleGrid(pixels, layer.w, layer.h);
    layers.push({
      x: layer.x,
      y: layer.y,
      w: layer.w,
      h: layer.h,
      gw: grid[0].length,
      gh: grid.length,
      grid,
    });
    console.log("OK:", layer.file);
  }
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(
    OUT_PATH,
    JSON.stringify({ cellSize: CELL_SIZE, layers }),
    "utf8",
  );
  console.log("Wrote", OUT_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
