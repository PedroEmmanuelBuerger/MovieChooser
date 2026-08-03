import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceIcon = path.join(root, "build", "icon.ico");
const targetDir = path.join(root, "dist-electron");
const targetIcon = path.join(targetDir, "icon.ico");

if (!fs.existsSync(sourceIcon)) {
  throw new Error("Missing build/icon.ico. Add the Windows app icon before building.");
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(sourceIcon, targetIcon);
console.log(`Copied icon to ${targetIcon}`);
