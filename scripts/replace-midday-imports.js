const fs = require("node:fs");
const path = require("node:path");

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts")) {
      let content = fs.readFileSync(fullPath, "utf8");
      content = content.replace(/@midday\/ui/g, "@anodizex/ui");
      content = content.replace(/@midday\/utils/g, "@anodizex/utils");
      content = content.replace(/@midday\/icons/g, "lucide-react"); // They use lucide-react or an internal package, let's map it safely if we can
      fs.writeFileSync(fullPath, content, "utf8");
    }
  }
}

replaceInDir(path.join(__dirname, "../apps/dashboard/src/components/tables"));
replaceInDir(path.join(__dirname, "../apps/dashboard/src/components/search"));
replaceInDir(path.join(__dirname, "../apps/dashboard/src/store"));
replaceInDir(path.join(__dirname, "../apps/dashboard/src/hooks"));

// Replace in specific headers
const headers = [
  "apps/dashboard/src/components/header.tsx",
  "apps/dashboard/src/components/desktop-header.tsx",
];
for (const header of headers) {
  const fullPath = path.join(__dirname, "..", header);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, "utf8");
    content = content.replace(/@midday\/ui/g, "@anodizex/ui");
    content = content.replace(/@midday\/utils/g, "@anodizex/utils");
    content = content.replace(/@midday\/icons/g, "lucide-react");
    fs.writeFileSync(fullPath, content, "utf8");
  }
}
