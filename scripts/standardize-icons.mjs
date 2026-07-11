import fs from "fs";
import { execSync } from "child_process";

const importLine = 'import { iconClass } from "@/lib/icon-styles";';

const output = execSync(
  'rg -l "className=\\"h-[346] " components --glob "*.tsx"',
  { encoding: "utf8", cwd: process.cwd() },
).trim();

const files = [...new Set(output.split(/\r?\n/).filter(Boolean))];

for (const file of files) {
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("lucide-react")) continue;

  const before = src;

  src = src.replace(/className="h-4 w-4"/g, 'className={iconClass()}');
  src = src.replace(/className="h-3 w-3"/g, 'className={iconClass()}');
  src = src.replace(/className="h-3.5 w-3.5"/g, 'className={iconClass()}');
  src = src.replace(/className="h-6 w-6"/g, 'className={iconClass("standalone")}');
  src = src.replace(/className="h-4 w-4 ([^"]+)"/g, 'className={iconClass("inline", "$1")}');
  src = src.replace(/className="h-3 w-3 ([^"]+)"/g, 'className={iconClass("inline", "$1")}');
  src = src.replace(/className="h-3.5 w-3.5 ([^"]+)"/g, 'className={iconClass("inline", "$1")}');
  src = src.replace(/className="h-6 w-6 ([^"]+)"/g, 'className={iconClass("standalone", "$1")}');
  src = src.replace(/ strokeWidth=\{2\}/g, "");

  if (src !== before) {
    if (!src.includes('@/lib/icon-styles')) {
      const lucideIdx = src.indexOf('from "lucide-react"');
      if (lucideIdx !== -1) {
        const lineEnd = src.indexOf("\n", lucideIdx);
        src = `${src.slice(0, lineEnd + 1)}${importLine}\n${src.slice(lineEnd + 1)}`;
      }
    }
    fs.writeFileSync(file, src);
    console.log("updated", file);
  }
}
