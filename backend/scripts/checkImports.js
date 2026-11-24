import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const srcDir = path.resolve(backendRoot, "src");

// Files to exclude from runtime dynamic import because they run CLI logic or start listeners
const EXCLUDE_FROM_DYNAMIC_IMPORT = [
  path.resolve(srcDir, "server.js"),
];

function isUnderScripts(filePath) {
  const rel = path.relative(srcDir, filePath).replace(/\\/g, "/");
  return rel.startsWith("scripts/");
}

const allJsFiles = [];

function collectJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      allJsFiles.push(fullPath);
    }
  }
}

collectJsFiles(srcDir);

console.log(`Auditing imports for ${allJsFiles.length} backend source files...\n`);

let failedCount = 0;
const results = [];

// Static analyzer for files that should not be dynamically imported
function verifyImportsStatically(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const dir = path.dirname(filePath);

  // Match: import ... from "..." or export ... from "..."
  const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?["']([^"']+)["']/g;
  let match;
  const errors = [];

  while ((match = importRegex.exec(content)) !== null) {
    const specifier = match[1];
    // Check relative imports
    if (specifier.startsWith(".")) {
      const targetPath = path.resolve(dir, specifier);
      if (!fs.existsSync(targetPath)) {
        errors.push(`Missing target file: ${specifier} -> ${targetPath}`);
      }
    }
  }

  return errors;
}

for (const file of allJsFiles) {
  const relPath = path.relative(backendRoot, file).replace(/\\/g, "/");
  const isExcluded = EXCLUDE_FROM_DYNAMIC_IMPORT.includes(file) || isUnderScripts(file);

  if (isExcluded) {
    // Perform static resolution check
    const staticErrors = verifyImportsStatically(file);
    if (staticErrors.length > 0) {
      failedCount++;
      results.push({
        file: relPath,
        status: "FAILED",
        details: staticErrors.join("; "),
      });
    } else {
      results.push({
        file: relPath,
        status: "SKIPPED(static OK)",
        details: "Excluded from execution (CLI / server entry)",
      });
    }
  } else {
    // Perform dynamic import
    try {
      const fileUrl = pathToFileURL(file).href;
      await import(fileUrl);
      results.push({ file: relPath, status: "OK", details: "-" });
    } catch (err) {
      failedCount++;
      results.push({
        file: relPath,
        status: "FAILED",
        details: err.message || String(err),
      });
    }
  }
}

console.log("-----------------------------------------------------------------------------------------");
console.log("File                                                     | Status              | Details");
console.log("-----------------------------------------------------------------------------------------");

for (const r of results) {
  const paddedFile = r.file.padEnd(56, " ");
  const paddedStatus = r.status.padEnd(19, " ");
  console.log(`${paddedFile} | ${paddedStatus} | ${r.details}`);
}

console.log("-----------------------------------------------------------------------------------------");
if (failedCount > 0) {
  console.error(`\nImport check FAILED: ${failedCount} file(s) failed validation.`);
  process.exit(1);
} else {
  console.log(`\nImport check PASSED: All ${allJsFiles.length} files verified successfully.`);
  process.exit(0);
}
