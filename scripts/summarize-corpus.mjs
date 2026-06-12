#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const dataDir = process.argv[2] ?? "data";
const validationReportPath =
  process.argv[3] ??
  "data/eval-results/mergeconflictbench_reference_validation.json";
const outputDir = process.argv[4] ?? "data/eval-results";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function writeCsv(filePath, columns, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    [
      columns.join(","),
      ...rows.map((row) =>
        columns.map((column) => csvEscape(row[column])).join(",")
      ),
    ].join("\n") + "\n"
  );
}

function tierForBlocks(blocks) {
  if (blocks >= 20) return "Complex";
  if (blocks >= 8) return "Moderate";
  return "Simple";
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = sorted.length / 2;
  if (Number.isInteger(middle)) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[Math.floor(middle)];
}

function loadValidationCounts(reportPath) {
  if (!fs.existsSync(reportPath)) return new Map();

  const report = readJson(reportPath);
  const counts = new Map();

  for (const result of report.testResults ?? []) {
    const caseName = path.basename(path.dirname(result.name));
    counts.set(caseName, result.assertionResults?.length ?? 0);
  }

  return counts;
}

const validationCounts = loadValidationCounts(validationReportPath);
const caseNames = fs
  .readdirSync(dataDir)
  .filter((name) => fs.existsSync(path.join(dataDir, name, "eval.config.json")))
  .sort();

const caseRows = caseNames.map((caseName) => {
  const evalConfig = readJson(path.join(dataDir, caseName, "eval.config.json"));
  const conflictConfig = readJson(
    path.join(dataDir, caseName, "conflict_eval.config.json")
  );
  const tests = validationCounts.get(caseName);

  if (tests == null) {
    throw new Error(
      `No validation test count found for ${caseName}. Run the reference validation first.`
    );
  }

  return {
    case: caseName,
    tier: tierForBlocks(evalConfig.conflictBlockCount),
    files: evalConfig.conflictedFileCount,
    blocks: evalConfig.conflictBlockCount,
    tests,
    behavior_descriptions: conflictConfig.preservedBehaviors.length,
    language: evalConfig.language,
  };
});

const tiers = ["Complex", "Moderate", "Simple"].map((tier) => {
  const rows = caseRows.filter((row) => row.tier === tier);
  const sum = (key) => rows.reduce((total, row) => total + row[key], 0);
  const blocks = rows.map((row) => row.blocks);

  return {
    tier,
    cases: rows.length,
    files: sum("files"),
    blocks: sum("blocks"),
    tests: sum("tests"),
    behavior_descriptions: sum("behavior_descriptions"),
    block_min: Math.min(...blocks),
    block_max: Math.max(...blocks),
    block_median: median(blocks),
  };
});

const total = {
  tier: "Total",
  cases: caseRows.length,
  files: caseRows.reduce((total, row) => total + row.files, 0),
  blocks: caseRows.reduce((total, row) => total + row.blocks, 0),
  tests: caseRows.reduce((total, row) => total + row.tests, 0),
  behavior_descriptions: caseRows.reduce(
    (total, row) => total + row.behavior_descriptions,
    0
  ),
  block_min: Math.min(...caseRows.map((row) => row.blocks)),
  block_max: Math.max(...caseRows.map((row) => row.blocks)),
  block_median: median(caseRows.map((row) => row.blocks)),
};

writeCsv(
  path.join(outputDir, "mergeconflictbench_case_summary.csv"),
  [
    "case",
    "tier",
    "files",
    "blocks",
    "tests",
    "behavior_descriptions",
    "language",
  ],
  caseRows
);

writeCsv(
  path.join(outputDir, "mergeconflictbench_tier_summary.csv"),
  [
    "tier",
    "cases",
    "files",
    "blocks",
    "tests",
    "behavior_descriptions",
    "block_min",
    "block_max",
    "block_median",
  ],
  [...tiers, total]
);

console.log(
  `Wrote ${caseRows.length} case rows and ${tiers.length + 1} tier rows to ${outputDir}`
);
console.log(
  `Total: ${total.cases} cases, ${total.files} files, ${total.blocks} blocks, ${total.tests} executable tests`
);
