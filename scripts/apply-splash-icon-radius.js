/**
 * Applies an iOS home-screen–style rounded mask to splash-icon.png
 * (standard ~22.37% corner radius on the short side; see Apple icon grid).
 *
 * Usage: node ./scripts/apply-splash-icon-radius.js [inputPath]
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const IOS_ICON_CORNER_RATIO = 0.2237;

async function main() {
  const inputPath = path.resolve(
    process.argv[2] || path.join("assets", "images", "splash-icon.png"),
  );
  if (!fs.existsSync(inputPath)) {
    console.error("Missing file:", inputPath);
    process.exit(1);
  }

  const meta = await sharp(inputPath).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) {
    console.error("Could not read image dimensions");
    process.exit(1);
  }

  const size = Math.min(w, h);
  const rx = Math.max(1, Math.round(size * IOS_ICON_CORNER_RATIO));

  const svg = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" ry="${rx}" fill="white"/>
    </svg>`,
  );

  const outBuf = await sharp(inputPath)
    .ensureAlpha()
    .composite([{ input: svg, blend: "dest-in" }])
    .png()
    .toBuffer();

  fs.writeFileSync(inputPath, outBuf);
  console.log(
    `Updated ${path.relative(process.cwd(), inputPath)} (${w}×${h}, rx=${rx})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
