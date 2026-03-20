/**
 * Combine island + hills walk areas into a single unified walk area image.
 * - Island pixels under the hills region are cleared (blocked)
 * - Hills walk area pixels are written in their place
 * - The entry point connects naturally where the hills walk area has walkable
 *   pixels at its edge that meet the remaining island walk area
 */
const sharp = require("sharp");
const path = require("path");

const ISLAND_WA = path.resolve(__dirname, "../assets/game-backup/island/main-island-walkArea.png");
const HILLS_WA = path.resolve(__dirname, "../assets/game-backup/hills/hills-walk-area.png");
const OUTPUT = path.resolve(__dirname, "../assets/game-backup/island/combined-walkArea.png");

// Hills walk area position in native island image coordinates (1751×705)
// Derived from: ISLAND_W * 0.38 - 422/2 + (422-392)/2 = 0.38*1751 - 211 + 15 ≈ 469
// And: ISLAND_H * 0.23 - 249/2 + (249-209)/2 + 249*0.06 ≈ 73
const HILLS_X = 469;
const HILLS_Y = 73;

async function main() {
  const islandMeta = await sharp(ISLAND_WA).metadata();
  const hillsMeta = await sharp(HILLS_WA).metadata();

  const iw = islandMeta.width;
  const ih = islandMeta.height;
  const hw = hillsMeta.width;
  const hh = hillsMeta.height;

  console.log(`Island walk area: ${iw}x${ih}`);
  console.log(`Hills walk area:  ${hw}x${hh}`);
  console.log(`Hills position:   (${HILLS_X}, ${HILLS_Y})`);

  const islandBuf = await sharp(ISLAND_WA).raw().ensureAlpha().toBuffer();
  const hillsBuf = await sharp(HILLS_WA).raw().ensureAlpha().toBuffer();

  const out = Buffer.from(islandBuf);

  for (let hy = 0; hy < hh; hy++) {
    for (let hx = 0; hx < hw; hx++) {
      const ix = HILLS_X + hx;
      const iy = HILLS_Y + hy;

      if (ix < 0 || ix >= iw || iy < 0 || iy >= ih) continue;

      const hIdx = (hy * hw + hx) * 4;
      const iIdx = (iy * iw + ix) * 4;

      if (hillsBuf[hIdx + 3] > 128) {
        // Hills walkable → copy hills pixel
        out[iIdx] = hillsBuf[hIdx];
        out[iIdx + 1] = hillsBuf[hIdx + 1];
        out[iIdx + 2] = hillsBuf[hIdx + 2];
        out[iIdx + 3] = hillsBuf[hIdx + 3];
      } else {
        // Hills transparent → block island pixel underneath
        out[iIdx + 3] = 0;
      }
    }
  }

  await sharp(out, { raw: { width: iw, height: ih, channels: 4 } })
    .png()
    .toFile(OUTPUT);

  console.log(`Wrote combined walk area: ${OUTPUT}`);
}

main().catch(console.error);
