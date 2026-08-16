import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brandDir = path.join(__dirname, "..", "public", "brand");

const exports = [
  { svg: "workgraph-icon.svg", png: "workgraph-icon-1024.png", size: 1024 },
  { svg: "workgraph-icon.svg", png: "workgraph-icon-2048.png", size: 2048 },
  { svg: "workgraph-icon-dark.svg", png: "workgraph-icon-dark-1024.png", size: 1024 },
  { svg: "workgraph-icon-dark.svg", png: "workgraph-icon-dark-2048.png", size: 2048 },
  { svg: "workgraph-logo-horizontal.svg", png: "workgraph-logo-horizontal-2400.png", width: 2400, height: 640 },
  { svg: "workgraph-graph-mark.svg", png: "workgraph-graph-mark-1024.png", size: 1024 },
  { svg: "workgraph-graph-mark.svg", png: "workgraph-graph-mark-2048.png", size: 2048 },
];

await mkdir(brandDir, { recursive: true });

for (const item of exports) {
  const svgPath = path.join(brandDir, item.svg);
  const pngPath = path.join(brandDir, item.png);
  const svg = await readFile(svgPath);

  if (item.size) {
    await sharp(svg, { density: 300 })
      .resize(item.size, item.size)
      .png()
      .toFile(pngPath);
  } else {
    await sharp(svg, { density: 300 })
      .resize(item.width, item.height)
      .png()
      .toFile(pngPath);
  }

  console.log(`Created ${item.png}`);
}

const readme = `# WorkGraph brand assets

## Landing logo (triangle mark)
Used on the marketing site navbar and footer.

| File | Use case |
|------|----------|
| workgraph-icon.svg | Vector icon, light background |
| workgraph-icon-1024.png | Profile pictures, avatars |
| workgraph-icon-2048.png | High-res print / large displays |
| workgraph-icon-dark.svg | Vector icon, dark background |
| workgraph-icon-dark-1024.png | Dark-mode social avatars |
| workgraph-icon-dark-2048.png | Dark-mode high-res |
| workgraph-logo-horizontal.svg | Full lockup with wordmark |
| workgraph-logo-horizontal-2400.png | Twitter/X header, LinkedIn banner |

## App logo (graph mark)
Used in the dashboard, auth, and product UI.

| File | Use case |
|------|----------|
| workgraph-graph-mark.svg | Vector graph icon |
| workgraph-graph-mark-1024.png | App icon / social |
| workgraph-graph-mark-2048.png | High-res graph icon |

Brand colors: #C41E3A (red), #0A0A0A (black), #FFFFFF (white)
`;

await writeFile(path.join(brandDir, "README.md"), readme);
console.log("Done.");
