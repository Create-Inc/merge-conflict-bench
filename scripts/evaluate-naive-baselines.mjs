#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dataDir = path.resolve(process.argv[2] ?? "data");
const outputDir = path.resolve(process.argv[3] ?? "data/eval-results");

const strategies = [
  {
    key: "accept_ours",
    label: "Accept ours",
    description: "Use only the current-branch side of every conflict block.",
  },
  {
    key: "accept_theirs",
    label: "Accept theirs",
    description: "Use only the incoming-branch side of every conflict block.",
  },
  {
    key: "accept_both",
    label: "Accept both",
    description: "Concatenate the current-branch side followed by the incoming-branch side.",
  },
];

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

function walkFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function resolveConflictContent(content, strategy) {
  const lines = content.split("\n");
  const output = [];
  let state = "normal";
  let ours = [];
  let theirs = [];

  for (const line of lines) {
    if (line.startsWith("<<<<<<<")) {
      state = "ours";
      ours = [];
      theirs = [];
      continue;
    }

    if (state === "ours" && line.startsWith("=======")) {
      state = "theirs";
      continue;
    }

    if (state === "theirs" && line.startsWith(">>>>>>>")) {
      if (strategy === "accept_ours") {
        output.push(...ours);
      } else if (strategy === "accept_theirs") {
        output.push(...theirs);
      } else if (strategy === "accept_both") {
        output.push(...ours, ...theirs);
      } else {
        throw new Error(`Unknown strategy: ${strategy}`);
      }
      state = "normal";
      continue;
    }

    if (state === "normal") {
      output.push(line);
    } else if (state === "ours") {
      ours.push(line);
    } else if (state === "theirs") {
      theirs.push(line);
    }
  }

  return output.join("\n");
}

function prepareStrategyWorkspace({ strategy, sourceDataDir }) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), `mcb-${strategy}-`));
  const workspaceDataDir = path.join(workspace, "data");
  fs.cpSync(sourceDataDir, workspaceDataDir, { recursive: true });

  for (const caseName of fs.readdirSync(sourceDataDir)) {
    const sourceCaseDir = path.join(sourceDataDir, caseName);
    const workspaceCaseDir = path.join(workspaceDataDir, caseName);
    const conflictedDir = path.join(sourceCaseDir, "conflicted");
    const resolvedDir = path.join(workspaceCaseDir, "resolved");

    if (!fs.existsSync(conflictedDir)) continue;

    fs.rmSync(resolvedDir, { recursive: true, force: true });

    for (const conflictedPath of walkFiles(conflictedDir)) {
      const relativePath = path.relative(conflictedDir, conflictedPath);
      const outputPath = path.join(resolvedDir, relativePath);
      const content = fs.readFileSync(conflictedPath, "utf8");
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(
        outputPath,
        resolveConflictContent(content, strategy),
        "utf8"
      );
    }
  }

  return workspace;
}

function runVitest({ workspace, outputPath, caseNames }) {
  try {
    execFileSync(
      "npx",
      [
        "-p",
        "vitest@4.1.8",
        "-p",
        "jsdom",
        "vitest",
        "run",
        "--reporter=json",
        `--outputFile=${outputPath}`,
        ...caseNames.map((caseName) => `data/${caseName}/merge.test.js`),
      ],
      {
        cwd: workspace,
        stdio: "pipe",
        timeout: 120_000,
      }
    );
  } catch {
    // Non-zero is expected for weak baselines. The JSON report is still useful.
  }
}

function loadCaseNames() {
  return fs
    .readdirSync(dataDir)
    .filter((caseName) =>
      fs.existsSync(path.join(dataDir, caseName, "merge.test.js"))
    )
    .sort();
}

function summarizeReport({ reportPath, strategy, caseNames, totalReferenceTests }) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const byCase = new Map();

  for (const result of report.testResults ?? []) {
    const caseName = path.basename(path.dirname(result.name));
    const assertions = result.assertionResults ?? [];
    const failedAssertions = assertions.filter(
      (assertion) => assertion.status !== "passed"
    );
    byCase.set(caseName, {
      case: caseName,
      strategy,
      suite_status: result.status,
      tests_executed: assertions.length,
      tests_passed: assertions.length - failedAssertions.length,
      tests_failed: failedAssertions.length,
      passes_all_tests:
        result.status === "passed" && failedAssertions.length === 0 ? 1 : 0,
      failure_message: failedAssertions[0]?.failureMessages?.[0] ?? result.message ?? "",
    });
  }

  const rows = caseNames.map(
    (caseName) =>
      byCase.get(caseName) ?? {
        case: caseName,
        strategy,
        suite_status: "missing",
        tests_executed: 0,
        tests_passed: 0,
        tests_failed: 0,
        passes_all_tests: 0,
        failure_message: "No Vitest result produced for this case",
      }
  );

  const casesPassed = rows.filter((row) => row.passes_all_tests === 1).length;

  return {
    rows,
    summary: {
      strategy,
      total_cases: caseNames.length,
      cases_passed: casesPassed,
      case_pass_rate: (casesPassed / caseNames.length).toFixed(4),
      vitest_tests_passed: report.numPassedTests ?? 0,
      vitest_tests_failed: report.numFailedTests ?? 0,
      reference_total_tests: totalReferenceTests,
      description: strategies.find((item) => item.key === strategy)?.description ?? "",
    },
  };
}

const caseNames = loadCaseNames();
const referenceSummaryPath = path.join(
  outputDir,
  "mergeconflictbench_tier_summary.csv"
);
const referenceTotalTests = fs
  .readFileSync(referenceSummaryPath, "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => line.split(","))
  .find(([tier]) => tier === "Total")?.[4];

if (!referenceTotalTests) {
  throw new Error(
    `Missing reference total tests in ${referenceSummaryPath}. Run scripts/summarize-corpus.mjs first.`
  );
}

const aggregateRows = [];
const perCaseRows = [];
fs.mkdirSync(outputDir, { recursive: true });

for (const { key } of strategies) {
  const workspace = prepareStrategyWorkspace({
    strategy: key,
    sourceDataDir: dataDir,
  });
  const reportPath = path.join(outputDir, `mergeconflictbench_${key}_validation.json`);

  try {
    runVitest({ workspace, outputPath: reportPath, caseNames });
    const { rows, summary } = summarizeReport({
      reportPath,
      strategy: key,
      caseNames,
      totalReferenceTests: Number(referenceTotalTests),
    });
    aggregateRows.push(summary);
    perCaseRows.push(...rows);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

writeCsv(
  path.join(outputDir, "mergeconflictbench_naive_baselines.csv"),
  [
    "strategy",
    "total_cases",
    "cases_passed",
    "case_pass_rate",
    "vitest_tests_passed",
    "vitest_tests_failed",
    "reference_total_tests",
    "description",
  ],
  aggregateRows
);

writeCsv(
  path.join(outputDir, "mergeconflictbench_naive_baselines_per_case.csv"),
  [
    "case",
    "strategy",
    "suite_status",
    "tests_executed",
    "tests_passed",
    "tests_failed",
    "passes_all_tests",
    "failure_message",
  ],
  perCaseRows
);

for (const row of aggregateRows) {
  console.log(
    `${row.strategy}: ${row.cases_passed}/${row.total_cases} cases passed`
  );
}
