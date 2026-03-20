/**
 * Build a single unified walk area with a controlled entrance:
 * 1. Island walk area is the base
 * 2. A "moat" (blocked pixels) is cut around the entire hills area
 * 3. The hills bounding box is pasted inside the moat
 * 4. A single narrow bridge connects the bounding box stairs to the island below
 *
 * Result: character can ONLY enter the hills through the bridge at the stairs
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ISLAND_WA  = path.resolve(__dirname, "../assets/game-backup/island/main-island-walkArea.png");
const HILLS_BB   = path.resolve(__dirname, "../assets/game-backup/hills/bounding-box.png");
const OUTPUT_PNG  = path.resolve(__dirname, "../assets/game-backup/island/unified-walkArea.png");
const OUTPUT_JSON = path.resolve(__dirname, "../lib/game/unifiedCollision.json");

// Native island image size
const IW = 1751, IH = 705;

// Hills.png native size and position in island image coords
const HILLS_W_N = 417, HILLS_H_N = 219;
const HILLS_X = Math.round(IW * 0.34 - HILLS_W_N / 2);
const HILLS_Y = Math.round(IH * 0.14 - HILLS_H_N / 2);

// Bounding box is same size as hills
const BB_W = HILLS_W_N, BB_H = HILLS_H_N;
const BB_X = HILLS_X;
const BB_Y = HILLS_Y;

// Moat: how many pixels of separation between bounding box and surrounding island
const MOAT = 20;

// Entrance bridge: bottom-right staircase of the bounding box
// Adjust BRIDGE_X1/X2 to match the stairs column in bounding-box.png
const BRIDGE_X1 = BB_X + Math.round(BB_W * 0.76);
const BRIDGE_X2 = BB_X + Math.round(BB_W * 0.92);
const BRIDGE_Y1 = BB_Y + BB_H;        // bottom edge of bounding box
const BRIDGE_Y2 = BB_Y + BB_H + MOAT; // bottom of moat

console.log(`Island: ${IW}x${IH}`);
console.log(`Hills:  pos=(${HILLS_X},${HILLS_Y}) size=${HILLS_W_N}x${HILLS_H_N}`);
console.log(`BB:     pos=(${BB_X},${BB_Y}) size=${BB_W}x${BB_H}`);
console.log(`Moat:   ${MOAT}px`);
console.log(`Bridge: x=(${BRIDGE_X1}-${BRIDGE_X2}) y=(${BRIDGE_Y1}-${BRIDGE_Y2})`);

const CELL_SIZE    = 8;
const ERODE_RADIUS = 1;

// Walkable pixel color (same green as bounding box)
const BRIDGE_R = 178, BRIDGE_G = 208, BRIDGE_B = 107, BRIDGE_A = 255;

async function main() {
  const islandBuf = await sharp(ISLAND_WA).raw().ensureAlpha().toBuffer();
  const bbBuf     = await sharp(HILLS_BB).raw().ensureAlpha().toBuffer();
  const out       = Buffer.from(islandBuf);

  // Step 1: Build a set of opaque bounding box pixel positions
  const bbOpaque = new Set();
  for (let by = 0; by < BB_H; by++) {
    for (let bx = 0; bx < BB_W; bx++) {
      if (bbBuf[(by * BB_W + bx) * 4 + 3] > 128) {
        bbOpaque.add(`${BB_X + bx},${BB_Y + by}`);
      }
    }
  }

  // Step 2: Erase island pixels within MOAT distance of any opaque BB pixel
  // (shape-following moat, not rectangular)
  const ERASE_X1 = Math.max(0, BB_X - MOAT);
  const ERASE_X2 = Math.min(IW - 1, BB_X + BB_W + MOAT);
  const ERASE_Y1 = Math.max(0, BB_Y - MOAT);
  const ERASE_Y2 = Math.min(IH - 1, BB_Y + BB_H + MOAT);

  for (let y = ERASE_Y1; y <= ERASE_Y2; y++) {
    for (let x = ERASE_X1; x <= ERASE_X2; x++) {
      // Keep bridge corridor
      if (x >= BRIDGE_X1 && x <= BRIDGE_X2 && y >= BRIDGE_Y1 && y <= BRIDGE_Y2) continue;
      // Skip if already inside BB (will be overwritten in step 3)
      if (x >= BB_X && x < BB_X + BB_W && y >= BB_Y && y < BB_Y + BB_H) continue;

      // Check if any opaque BB pixel is within MOAT distance
      let nearBB = false;
      for (let dy = -MOAT; dy <= MOAT && !nearBB; dy++) {
        for (let dx = -MOAT; dx <= MOAT && !nearBB; dx++) {
          if (dx * dx + dy * dy <= MOAT * MOAT && bbOpaque.has(`${x + dx},${y + dy}`)) {
            nearBB = true;
          }
        }
      }
      if (nearBB) {
        out[(y * IW + x) * 4 + 3] = 0;
      }
    }
  }

  // Step 2: Paste bounding box pixels into their position
  for (let by = 0; by < BB_H; by++) {
    for (let bx = 0; bx < BB_W; bx++) {
      const ix = BB_X + bx, iy = BB_Y + by;
      if (ix < 0 || ix >= IW || iy < 0 || iy >= IH) continue;
      const bbIdx = (by * BB_W + bx) * 4;
      const iIdx  = (iy * IW + ix) * 4;
      out[iIdx]     = bbBuf[bbIdx];
      out[iIdx + 1] = bbBuf[bbIdx + 1];
      out[iIdx + 2] = bbBuf[bbIdx + 2];
      out[iIdx + 3] = bbBuf[bbIdx + 3];
    }
  }

  // Step 3: Fill bridge corridor with walkable pixels
  for (let y = BRIDGE_Y1; y <= BRIDGE_Y2; y++) {
    for (let x = BRIDGE_X1; x <= BRIDGE_X2; x++) {
      if (x < 0 || x >= IW || y < 0 || y >= IH) continue;
      const idx = (y * IW + x) * 4;
      out[idx]     = BRIDGE_R;
      out[idx + 1] = BRIDGE_G;
      out[idx + 2] = BRIDGE_B;
      out[idx + 3] = BRIDGE_A;
    }
  }

  await sharp(out, { raw: { width: IW, height: IH, channels: 4 } })
    .png()
    .toFile(OUTPUT_PNG);
  console.log(`Wrote: ${OUTPUT_PNG}`);

  // Step 4: Build collision grid with erosion
  const cols = Math.ceil(IW / CELL_SIZE);
  const rows = Math.ceil(IH / CELL_SIZE);
  const grid = [];
  for (let row = 0; row < rows; row++) {
    const rowData = [];
    for (let col = 0; col < cols; col++) {
      const px = Math.min(col * CELL_SIZE + Math.floor(CELL_SIZE / 2), IW - 1);
      const py = Math.min(row * CELL_SIZE + Math.floor(CELL_SIZE / 2), IH - 1);
      rowData.push(out[(py * IW + px) * 4 + 3] < 128 ? 1 : 0);
    }
    grid.push(rowData);
  }

  // Erode
  const eroded = grid.map(r => [...r]);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== 1) continue;
      for (let dr = -ERODE_RADIUS; dr <= ERODE_RADIUS; dr++) {
        for (let dc = -ERODE_RADIUS; dc <= ERODE_RADIUS; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
              dr * dr + dc * dc <= ERODE_RADIUS * ERODE_RADIUS)
            eroded[nr][nc] = 1;
        }
      }
    }
  }

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify({
    width: IW, height: IH, cellSize: CELL_SIZE, cols, rows, grid: eroded
  }));
  console.log(`Wrote: ${OUTPUT_JSON}`);
}

main().catch(console.error);
