import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = new URL("..", import.meta.url);
const ignored = new Set([
  ".git",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mdc",
  ".ts",
  ".toml",
  ".yml",
  ".yaml",
]);
const suspicious =
  /(api[_-]?key|secret[_-]?key|access[_-]?token|private[_-]?key)\s*[:=]\s*['"][^'"]{8,}/giu;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (textExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const rootPath = root.pathname;
const files = await walk(rootPath);
const findings = [];
for (const file of files) {
  const content = await readFile(file, "utf8");
  if (suspicious.test(content)) findings.push(relative(rootPath, file));
  suspicious.lastIndex = 0;
}

const required = ["LICENSE", "README.md", "SECURITY.md", "CONTRIBUTING.md"];
for (const file of required) {
  try {
    await readFile(join(rootPath, file), "utf8");
  } catch {
    findings.push(`missing:${file}`);
  }
}

if (findings.length > 0) {
  throw new Error(`Project audit failed: ${findings.join(", ")}`);
}

process.stdout.write(
  JSON.stringify({
    ok: true,
    filesScanned: files.length,
    secretFindings: 0,
    license: "MIT",
  }) + "\n",
);
