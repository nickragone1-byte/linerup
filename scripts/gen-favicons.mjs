// Generates all favicon/icon assets from SVG source using sharp
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

// Build the "L + green dot" SVG at a given pixel size
function makeSvg(size) {
  const rx = Math.round(size * 0.15);

  // Vertical bar of the L
  const vx = Math.round(size * 0.21);
  const vy = Math.round(size * 0.14);
  const vw = Math.round(size * 0.155);
  const vh = Math.round(size * 0.72);   // full height minus bottom padding

  // Horizontal bar of the L
  const hx = vx;
  const hy = Math.round(size * 0.72);
  const hw = Math.round(size * 0.54);
  const hh = Math.round(size * 0.14);

  // Green dot — bottom-right corner of horizontal bar
  const dotR = Math.round(size * 0.085);
  const dotCx = hx + hw;
  const dotCy = hy + hh;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#0a0e1a"/>
  <rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" rx="2" fill="#ffffff"/>
  <rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="2" fill="#ffffff"/>
  <circle cx="${dotCx}" cy="${dotCy}" r="${dotR}" fill="#00e088"/>
</svg>`;
}

async function generatePng(size, filename) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg).png().toFile(join(publicDir, filename));
  console.log(`  ✓ ${filename} (${size}×${size})`);
}

async function generateIco(filename) {
  // ICO = 16px and 32px PNGs bundled; we embed the 32px PNG as the ico
  // (browsers accept single-size .ico; we'll ship 32px for crispness)
  const svg32 = Buffer.from(makeSvg(32));
  const png32 = await sharp(svg32).png().toBuffer();
  // Write a minimal ICO: header + 1 image directory entry + PNG data
  // Using PNG-in-ICO format (supported by all modern browsers)
  const ICO_HEADER_SIZE = 6;
  const ICO_DIR_SIZE = 16;
  const header = Buffer.alloc(ICO_HEADER_SIZE);
  header.writeUInt16LE(0, 0);  // reserved
  header.writeUInt16LE(1, 2);  // type: 1 = ICO
  header.writeUInt16LE(1, 4);  // number of images

  const dir = Buffer.alloc(ICO_DIR_SIZE);
  dir[0] = 32;  // width (0 = 256)
  dir[1] = 32;  // height
  dir[2] = 0;   // color count
  dir[3] = 0;   // reserved
  dir.writeUInt16LE(1, 4);  // color planes
  dir.writeUInt16LE(32, 6); // bits per pixel
  dir.writeUInt32LE(png32.length, 8);  // size of image data
  dir.writeUInt32LE(ICO_HEADER_SIZE + ICO_DIR_SIZE, 12); // offset

  const ico = Buffer.concat([header, dir, png32]);
  writeFileSync(join(publicDir, filename), ico);
  console.log(`  ✓ ${filename} (ICO with 32×32 PNG)`);
}

async function main() {
  console.log("Generating favicon assets...");
  await generatePng(16, "favicon-16x16.png");
  await generatePng(32, "favicon-32x32.png");
  await generatePng(180, "apple-touch-icon.png");
  await generatePng(192, "android-chrome-192x192.png");
  await generatePng(512, "android-chrome-512x512.png");
  await generateIco("favicon.ico");

  const manifest = {
    name: "Linerup",
    short_name: "Linerup",
    description: "Public, transparent MLB analytics model.",
    start_url: "/",
    display: "standalone",
    theme_color: "#0a0e1a",
    background_color: "#0a0e1a",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
  writeFileSync(join(publicDir, "site.webmanifest"), JSON.stringify(manifest, null, 2));
  console.log("  ✓ site.webmanifest");
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
