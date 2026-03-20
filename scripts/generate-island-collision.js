/**
 * Generate collision grid from island PNG alpha channel.
 * Transparent pixels = blocked (1), opaque pixels = walkable (0).
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const INPUT = path.resolve(
  __dirname,
  "../assets/game-backup/island/main-island-walkArea.png",
);
const OUTPUT = path.resolve(__dirname, "../lib/game/islandCollision.json");
const CELL_SIZE = 8; // sample every 8px for reasonable grid size
const ERODE_RADIUS = 1; // shrink walkable area inward by this many cells (~24px)

async function main() {
  const img = sharp(INPUT);
  const meta = await img.metadata();
  const { width, height } = meta;
  console.log(`Island image: ${width}x${height}`);

  const { data } = await img
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const cols = Math.ceil(width / CELL_SIZE);
  const rows = Math.ceil(height / CELL_SIZE);
  console.log(`Grid: ${cols}x${rows} (cell size ${CELL_SIZE}px)`);

  const grid = [];
  for (let row = 0; row < rows; row++) {
    const rowData = [];
    for (let col = 0; col < cols; col++) {
      const px = Math.min(
        col * CELL_SIZE + Math.floor(CELL_SIZE / 2),
        width - 1,
      );
      const py = Math.min(
        row * CELL_SIZE + Math.floor(CELL_SIZE / 2),
        height - 1,
      );
      const idx = (py * width + px) * 4;
      const alpha = data[idx + 3];
      // alpha < 128 = transparent = blocked (1), else walkable (0)
      rowData.push(alpha < 128 ? 1 : 0);
    }
    grid.push(rowData);
  }

  // Erode: any walkable cell within ERODE_RADIUS of a blocked cell becomes blocked
  const eroded = grid.map((r) => [...r]);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        for (let dr = -ERODE_RADIUS; dr <= ERODE_RADIUS; dr++) {
          for (let dc = -ERODE_RADIUS; dc <= ERODE_RADIUS; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (dr * dr + dc * dc <= ERODE_RADIUS * ERODE_RADIUS) {
                eroded[nr][nc] = 1;
              }
            }
          }
        }
      }
    }
  }
  console.log(
    `Eroded walkable area by ${ERODE_RADIUS} cells (${ERODE_RADIUS * CELL_SIZE}px)`,
  );

  const result = {
    width,
    height,
    cellSize: CELL_SIZE,
    cols,
    rows,
    grid: eroded,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(result));
  console.log(`Wrote ${OUTPUT} (${cols * rows} cells)`);
}

main().catch(console.error);
