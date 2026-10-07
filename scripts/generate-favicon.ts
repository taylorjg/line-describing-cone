import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  buildFaviconSvg,
  FAVICON_ARC_PROGRESS,
} from "../src/graphics/favicon-svg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

mkdirSync(publicDir, { recursive: true });

const svg = buildFaviconSvg(FAVICON_ARC_PROGRESS);
writeFileSync(join(publicDir, "favicon.svg"), svg, "utf8");

const pngFromSvg = sharp(Buffer.from(svg));

await pngFromSvg
  .clone()
  .resize(32, 32)
  .png()
  .toFile(join(publicDir, "favicon-32.png"));
await pngFromSvg
  .clone()
  .resize(180, 180)
  .png()
  .toFile(join(publicDir, "apple-touch-icon.png"));

console.log(
  "Generated public/favicon.svg, favicon-32.png, apple-touch-icon.png"
);
