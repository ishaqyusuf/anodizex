const fs = require("node:fs");
const path = require("node:path");

const files = [
  "apps/dashboard/src/components/portal.tsx",
  "apps/dashboard/src/hooks/use-sticky-columns.ts",
  "apps/dashboard/src/utils/table-settings.ts",
];
for (const file of files) {
  const fullPath = path.join(__dirname, "..", file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, "utf8");
    content = content.replace(/@midday\/ui/g, "@anodizex/ui");
    content = content.replace(/@midday\/utils/g, "@anodizex/utils");
    content = content.replace(/@midday\/icons/g, "lucide-react");
    fs.writeFileSync(fullPath, content, "utf8");
  }
}
