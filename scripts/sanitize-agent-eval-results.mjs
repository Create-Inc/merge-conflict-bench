#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_INPUT_DIR = "raw-eval-results";
const DEFAULT_OUTPUT_DIR = "data/eval-results";

const inputDir = process.argv[2] ?? DEFAULT_INPUT_DIR;
const outputDir = process.argv[3] ?? DEFAULT_OUTPUT_DIR;

const SCORE_NAMES = {
  reported: "Resolution Marked as Successful",
  coverage: "Block Resolution Coverage",
  markers: "No Conflict Markers",
  passes: "Passes Tests",
  tokens: "Usage Available",
};

const MODEL_LABELS = {
  "anthropic-sonnet-4.6": "Sonnet 4.6",
  "anthropic-opus-4.6": "Opus 4.6",
  "anthropic-opus-4.7": "Opus 4.7",
  "google-2.0-flash": "Gemini 2.0 Flash",
  "google-2.5-flash": "Gemini 2.5 Flash",
  "google-2.5-pro": "Gemini 2.5 Pro",
  "google-3.0-pro": "Gemini 3.0 Pro",
  "openai-gpt-4.1": "GPT-4.1",
};

const MODEL_ORDER = [
  "anthropic-sonnet-4.6",
  "anthropic-opus-4.6",
  "anthropic-opus-4.7",
  "google-2.0-flash",
  "google-2.5-flash",
  "google-2.5-pro",
  "google-3.0-pro",
  "openai-gpt-4.1",
];

function readJson(filePath) {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    if (!text.trim()) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (!/[",\n\r]/.test(stringValue)) return stringValue;
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function writeCsv(filePath, rows, columns) {
  const lines = [
    columns.join(","),
    ...rows.map((row) =>
      columns.map((column) => csvEscape(row[column])).join(",")
    ),
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function scoreByName(scores, resultId) {
  const byName = {};
  for (const score of scores) {
    if (score.resultId === resultId) {
      byName[score.name] = score;
    }
  }
  return byName;
}

function boolScore(score) {
  if (!score) return null;
  return Number(score.score) > 0 ? 1 : 0;
}

function numericScore(score) {
  if (!score || score.score === null || score.score === undefined) return null;
  return Number(score.score);
}

function stableMessage(score) {
  const message = score?.metadata?.message;
  return typeof message === "string" ? message : "";
}

function classifyFailure(row) {
  if (row.passes_tests === 1) return "Passed";
  if (row.block_resolution_coverage !== null && row.block_resolution_coverage < 1) {
    return "Missing or unparsable block replacement";
  }
  if (row.no_conflict_markers !== 1) {
    return "Conflict markers remaining";
  }

  const message = row._passes_tests_message.toLowerCase();

  if (
    /syntaxerror|parse error|failed to parse|unexpected token|unterminated|string literal|expression expected|expected .* but found/.test(
      message
    )
  ) {
    return "Syntax or parse failure";
  }
  if (
    /cannot find module|failed to resolve import|does not provide an export|no exported member|module not found|imported module|export .* was not found/.test(
      message
    )
  ) {
    return "Module import/export failure";
  }
  if (
    /referenceerror|typeerror|is not a function|cannot read properties|cannot access .* before initialization/.test(
      message
    )
  ) {
    return "Runtime reference/type error";
  }
  if (/assertionerror|expected .* to|received|to equal|to contain|to have/.test(message)) {
    return "Assertion-level behavior mismatch";
  }
  return "Other hidden-test failure";
}

function normalizeResult(fileName, experiment, result, scores) {
  const byName = scoreByName(scores, result.id);
  const reportedScore = byName[SCORE_NAMES.reported];
  const coverageScore = byName[SCORE_NAMES.coverage];
  const markerScore = byName[SCORE_NAMES.markers];
  const passesScore = byName[SCORE_NAMES.passes];
  const tokenScore = byName[SCORE_NAMES.tokens] ?? byName["Total Tokens"];
  const tokenUsage = tokenScore?.metadata?.tokenUsage ?? null;

  const row = {
    model_provider: experiment.portkeyProvider,
    model: MODEL_LABELS[experiment.portkeyProvider] ?? experiment.portkeyProvider,
    fixture: result.testName,
    passes_tests: boolScore(passesScore),
    resolution_reported_success: boolScore(reportedScore),
    no_conflict_markers: boolScore(markerScore),
    block_resolution_coverage: numericScore(coverageScore),
    expected_block_count: coverageScore?.metadata?.expectedBlockCount ?? null,
    configured_block_count: coverageScore?.metadata?.configuredBlockCount ?? null,
    resolved_block_count: coverageScore?.metadata?.resolvedBlockCount ?? null,
    parsed_resolution_count: coverageScore?.metadata?.parsedResolutionCount ?? null,
    duration_ms: result.durationMs,
    duration_min:
      result.durationMs == null ? null : Number((result.durationMs / 60000).toFixed(4)),
    generation_duration_ms: tokenScore?.metadata?.durationMs ?? null,
    prompt_tokens: tokenUsage?.promptTokens ?? null,
    completion_tokens: tokenUsage?.completionTokens ?? null,
    total_tokens: tokenUsage?.totalTokens ?? numericScore(tokenScore),
    source_export: fileName,
    experiment_id: experiment.id,
    result_id: result.id,
    result_created_at: result.createdAt,
    _passes_tests_message: stableMessage(passesScore),
  };

  row.failure_bucket = classifyFailure(row);
  delete row._passes_tests_message;
  return row;
}

function modelRank(modelProvider) {
  const index = MODEL_ORDER.indexOf(modelProvider);
  return index === -1 ? MODEL_ORDER.length : index;
}

function compareRows(left, right) {
  const modelDelta = modelRank(left.model_provider) - modelRank(right.model_provider);
  if (modelDelta !== 0) return modelDelta;
  return left.fixture.localeCompare(right.fixture);
}

function wilson(successes, n) {
  const z = 1.959963984540054;
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half =
    (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [center - half, center + half];
}

function average(values) {
  const numericValues = values.filter((value) => value !== null && value !== undefined);
  if (numericValues.length === 0) return null;
  return numericValues.reduce((sum, value) => sum + Number(value), 0) / numericValues.length;
}

function roundedAverage(values) {
  const value = average(values);
  return value === null ? null : Number(value.toFixed(4));
}

function summarize(rows) {
  const byModel = new Map();
  for (const row of rows) {
    if (!byModel.has(row.model_provider)) byModel.set(row.model_provider, []);
    byModel.get(row.model_provider).push(row);
  }

  const summaries = [];
  for (const modelRows of byModel.values()) {
    const first = modelRows[0];
    const n = modelRows.length;
    const passes = modelRows.filter((row) => row.passes_tests === 1).length;
    const reported = modelRows.filter(
      (row) => row.resolution_reported_success === 1
    ).length;
    const falseConfidence = modelRows.filter(
      (row) => row.resolution_reported_success === 1 && row.passes_tests !== 1
    ).length;
    const markerFailures = modelRows.filter(
      (row) => row.no_conflict_markers !== 1
    ).length;
    const rowsWithTokens = modelRows.filter((row) => row.total_tokens != null);
    const totalTokens = rowsWithTokens.reduce(
      (sum, row) => sum + Number(row.total_tokens),
      0
    );
    const totalDuration = modelRows.reduce(
      (sum, row) => sum + Number(row.duration_ms ?? 0),
      0
    );
    const [ciLow, ciHigh] = wilson(passes, n);

    summaries.push({
      model_provider: first.model_provider,
      model: first.model,
      fixtures: n,
      passes_tests: passes,
      pass_rate: Number((passes / n).toFixed(4)),
      pass_rate_ci95_low: Number(ciLow.toFixed(4)),
      pass_rate_ci95_high: Number(ciHigh.toFixed(4)),
      resolution_reported_success: reported,
      false_confidence_count: falseConfidence,
      false_confidence_rate:
        reported === 0 ? null : Number((falseConfidence / reported).toFixed(4)),
      marker_failures: markerFailures,
      avg_block_resolution_coverage: roundedAverage(
        modelRows.map((row) => row.block_resolution_coverage)
      ),
      avg_duration_min: Number((totalDuration / n / 60000).toFixed(4)),
      token_usage_count: rowsWithTokens.length,
      avg_total_tokens:
        rowsWithTokens.length === 0
          ? null
          : Math.round(totalTokens / rowsWithTokens.length),
      total_tokens: totalTokens,
    });
  }

  return summaries.sort(compareRows);
}

const files = fs.existsSync(inputDir)
  ? fs.readdirSync(inputDir).filter((file) => file.endsWith(".json")).sort()
  : [];

const allRows = [];
const manifest = [];
for (const fileName of files) {
  const filePath = path.join(inputDir, fileName);
  const payload = readJson(filePath);
  if (!payload) continue;
  const experiment = payload.experiments?.[0];
  if (!experiment?.portkeyProvider) continue;
  const results = payload.results ?? [];
  const scores = payload.scores ?? [];
  manifest.push({
    source_export: fileName,
    experiment_id: experiment.id,
    experiment_name: experiment.experimentName,
    experiment_status: experiment.status,
    model_provider: experiment.portkeyProvider,
    result_count: results.length,
    score_count: scores.length,
  });
  for (const result of results) {
    allRows.push(normalizeResult(fileName, experiment, result, scores));
  }
}

const latestByModelFixture = new Map();
for (const row of allRows) {
  const key = `${row.model_provider}|${row.fixture}`;
  const old = latestByModelFixture.get(key);
  if (!old || new Date(row.result_created_at) > new Date(old.result_created_at)) {
    latestByModelFixture.set(key, row);
  }
}

const finalRows = [...latestByModelFixture.values()].sort(compareRows);

fs.mkdirSync(outputDir, { recursive: true });

const perFixtureColumns = [
  "model_provider",
  "model",
  "fixture",
  "passes_tests",
  "resolution_reported_success",
  "no_conflict_markers",
  "block_resolution_coverage",
  "expected_block_count",
  "configured_block_count",
  "resolved_block_count",
  "parsed_resolution_count",
  "failure_bucket",
  "duration_ms",
  "duration_min",
  "generation_duration_ms",
  "prompt_tokens",
  "completion_tokens",
  "total_tokens",
  "source_export",
  "experiment_id",
  "result_id",
  "result_created_at",
];

const summaryColumns = [
  "model_provider",
  "model",
  "fixtures",
  "passes_tests",
  "pass_rate",
  "pass_rate_ci95_low",
  "pass_rate_ci95_high",
  "resolution_reported_success",
  "false_confidence_count",
  "false_confidence_rate",
  "marker_failures",
  "avg_block_resolution_coverage",
  "avg_duration_min",
  "token_usage_count",
  "avg_total_tokens",
  "total_tokens",
];

const summaries = summarize(finalRows);
writeCsv(
  path.join(outputDir, "mergeconflictbench_agent_full_run_per_fixture.csv"),
  finalRows,
  perFixtureColumns
);
fs.writeFileSync(
  path.join(outputDir, "mergeconflictbench_agent_full_run_per_fixture.jsonl"),
  `${finalRows
    .map((row) =>
      JSON.stringify(
        Object.fromEntries(perFixtureColumns.map((column) => [column, row[column]]))
      )
    )
    .join("\n")}\n`
);
writeCsv(
  path.join(outputDir, "mergeconflictbench_agent_full_run_summary.csv"),
  summaries,
  summaryColumns
);
fs.writeFileSync(
  path.join(outputDir, "mergeconflictbench_agent_full_run_manifest.json"),
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      input_dir: "<raw eval export directory>",
      dedupe_rule:
        "For each model_provider and fixture, keep the row with the latest result_created_at.",
      privacy_note:
        "This artifact excludes raw prompts, generated resolved files, hidden-test messages, and scorer message bodies. It preserves per-fixture scores and metadata needed to reproduce the paper tables.",
      source_exports: manifest,
    },
    null,
    2
  )}\n`
);

console.log(
  `Wrote ${finalRows.length} per-fixture rows and ${summaries.length} summary rows to ${outputDir}`
);
