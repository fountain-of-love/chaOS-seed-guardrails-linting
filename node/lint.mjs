import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { parse } from "acorn";
import { simple } from "acorn-walk";

const sourceDirectories = ["bin", "hooks", "src", "test"];
const ignoredDirectories = new Set(["node_modules", "venv"]);
const sourceExtensions = new Set([".js", ".mjs", ".cjs"]);

function* sourceFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && !ignoredDirectories.has(entry.name) && !entry.name.startsWith(".")) {
      yield* sourceFiles(path);
    } else if (entry.isFile() && sourceExtensions.has(extname(entry.name))) {
      yield path;
    }
  }
}

function checkFile(path, root) {
  const name = relative(root, path);
  let issues = 0;
  function report(location, message) {
    console.error(`${name}:${location.line}:${location.column + 1}: ${message}`);
    issues += 1;
  }

  let tree;
  try {
    tree = parse(readFileSync(path, "utf8"), {
      ecmaVersion: "latest",
      sourceType: extname(path) === ".cjs" ? "commonjs" : "module",
      locations: true,
    });
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    report(error.loc, `JS000 ${error.message}`);
    return issues;
  }

  simple(tree, {
    VariableDeclaration(node) {
      if (node.kind === "var") report(node.loc.start, "JS001 Declare variables with const or let.");
    },
    BinaryExpression(node) {
      if (node.operator === "==" || node.operator === "!=") {
        report(node.loc.start, "JS002 Compare values with === or !==.");
      }
    },
  });
  return issues;
}

const root = resolve(process.env.CHAOS_CHECKOUT);
const files = sourceDirectories
  .map((name) => join(root, name))
  .filter((directory) => existsSync(directory) && lstatSync(directory).isDirectory())
  .flatMap((directory) => [...sourceFiles(directory)])
  .sort();
const issues = files.reduce((count, path) => count + checkFile(path, root), 0);
console.log(`Node.js lint checked ${files.length} files and found ${issues} issues.`);
process.exitCode = Number(issues > 0);
