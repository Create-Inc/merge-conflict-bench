#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_OUTPUT_DIR = "data/eval-results";
const MANIFEST_FILE = "mergeconflictbench_agent_full_run_manifest.json";
const PER_FIXTURE_CSV = "mergeconflictbench_agent_full_run_per_fixture.csv";
const PER_FIXTURE_JSONL = "mergeconflictbench_agent_full_run_per_fixture.jsonl";

const outputDir = process.argv[2] ?? DEFAULT_OUTPUT_DIR;
const apiKey = process.env.BRAINTRUST_API_KEY;
const createdAfter =
  process.env.BRAINTRUST_CREATED_AFTER ?? "2026-06-11T06:00:00.000Z";
const createdBefore =
  process.env.BRAINTRUST_CREATED_BEFORE ?? "2026-06-12T05:59:59.999Z";

if (!apiKey) {
  throw new Error(
    "Set BRAINTRUST_API_KEY before exporting Braintrust agent results."
  );
}

const SCORE_NAMES = {
  reported: "Resolution Marked as Successful",
  coverage: "Block Resolution Coverage",
  markers: "No Conflict Markers",
  passes: "Passes Tests",
  tokens: "Usage Available",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

function maybeParseJson(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeScore(value) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function round(value, decimals) {
  if (value === null || value === undefined) return null;
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
}

function classifyFailure(row) {
  if (row.passes_tests === 1) return "Passed";
  if (row.usage_available !== 1) return "Provider/model route failure";
  if (
    row.block_resolution_coverage !== null &&
    row.block_resolution_coverage < 1
  ) {
    return "Missing or unparsable block replacement";
  }
  if (row.no_conflict_markers !== 1) return "Conflict markers remaining";
  if (row.resolution_reported_success !== 1) {
    return "Resolution not reported successful";
  }
  return "Hidden-test behavior mismatch";
}

async function fetchBtql(query) {
  const response = await fetch("https://api.braintrust.dev/btql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "accept-encoding": "gzip",
    },
    body: JSON.stringify({
      query,
      use_columnstore: false,
      brainstore_realtime: true,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Braintrust query failed: ${response.status} ${response.statusText}\n${await response.text()}`
    );
  }

  const payload = await response.json();
  if (payload.error || payload.errors) {
    throw new Error(JSON.stringify(payload.error ?? payload.errors, null, 2));
  }
  return payload.data ?? [];
}

async function fetchSummaryRows(experimentId) {
  return fetchBtql(`
    SELECT id, root_span_id, created, input, scores, metrics
    FROM experiment('${experimentId}', shape => 'summary')
    WHERE created >= '${createdAfter}' AND created <= '${createdBefore}'
    LIMIT 1000
  `);
}

async function fetchScoreMetadataRows(experimentId) {
  return fetchBtql(`
    SELECT root_span_id, scores, metadata
    FROM experiment('${experimentId}')
    WHERE created >= '${createdAfter}' AND created <= '${createdBefore}'
      AND span_attributes.type = 'score'
    LIMIT 1000
  `);
}

function buildScoreMetadataByRoot(scoreRows) {
  const byRoot = new Map();
  for (const row of scoreRows) {
    const rootSpanId = row.root_span_id;
    const scoreName = Object.keys(row.scores ?? {})[0];
    if (!rootSpanId || !scoreName) continue;

    const metadata = maybeParseJson(row.metadata);
    const rootScores = byRoot.get(rootSpanId) ?? {};
    if (
      scoreName === SCORE_NAMES.coverage &&
      metadata &&
      typeof metadata === "object"
    ) {
      rootScores.coverageMetadata = metadata;
    }
    if (
      scoreName === SCORE_NAMES.tokens &&
      metadata &&
      typeof metadata === "object"
    ) {
      rootScores.usageMetadata = metadata;
    }
    byRoot.set(rootSpanId, rootScores);
  }
  return byRoot;
}

function normalizeRow({ experiment, row, scoreMetadata }) {
  const scores = row.scores ?? {};
  const coverageMetadata = scoreMetadata.coverageMetadata ?? {};
  const usageMetadata = scoreMetadata.usageMetadata ?? {};
  const tokenUsage = usageMetadata.tokenUsage ?? {};
  const durationMs =
    row.metrics?.duration === null || row.metrics?.duration === undefined
      ? null
      : Math.round(Number(row.metrics.duration) * 1000);

  const normalized = {
    model_provider: experiment.model_provider,
    model: experiment.model,
    fixture: row.input?.name ?? null,
    passes_tests: normalizeScore(scores[SCORE_NAMES.passes]),
    resolution_reported_success: normalizeScore(scores[SCORE_NAMES.reported]),
    no_conflict_markers: normalizeScore(scores[SCORE_NAMES.markers]),
    block_resolution_coverage: normalizeScore(scores[SCORE_NAMES.coverage]),
    usage_available: normalizeScore(scores[SCORE_NAMES.tokens]),
    expected_block_count: coverageMetadata.expectedBlockCount ?? null,
    configured_block_count: coverageMetadata.configuredBlockCount ?? null,
    resolved_block_count: coverageMetadata.resolvedBlockCount ?? null,
    parsed_resolution_count: coverageMetadata.parsedResolutionCount ?? null,
    duration_ms: durationMs,
    duration_min: durationMs === null ? null : round(durationMs / 60000, 4),
    generation_duration_ms: usageMetadata.durationMs ?? null,
    prompt_tokens: tokenUsage.promptTokens ?? null,
    completion_tokens: tokenUsage.completionTokens ?? null,
    total_tokens: tokenUsage.totalTokens ?? null,
    source_export: "braintrust-summary-query",
    experiment_id: experiment.experiment_id,
    result_id: row.id,
    root_span_id: row.root_span_id,
    result_created_at: row.created,
  };

  normalized.failure_bucket = classifyFailure(normalized);
  return normalized;
}

function modelRank(experiments, modelProvider) {
  const index = experiments.findIndex(
    (experiment) => experiment.model_provider === modelProvider
  );
  return index === -1 ? experiments.length : index;
}

function compareRows(experiments) {
  return (left, right) => {
    const modelDelta =
      modelRank(experiments, left.model_provider) -
      modelRank(experiments, right.model_provider);
    if (modelDelta !== 0) return modelDelta;
    return String(left.fixture).localeCompare(String(right.fixture));
  };
}

function summarizeRows(rows) {
  const byModel = new Map();
  for (const row of rows) {
    const modelRows = byModel.get(row.model_provider) ?? [];
    modelRows.push(row);
    byModel.set(row.model_provider, modelRows);
  }

  return [...byModel.values()].map((modelRows) => {
    const first = modelRows[0];
    const scoredPassRows = modelRows.filter((row) => row.passes_tests !== null);
    const passedRows = modelRows.filter((row) => row.passes_tests === 1);
    const usageRows = modelRows.filter((row) => row.usage_available === 1);
    const average = (field) => {
      const values = modelRows
        .map((row) => row[field])
        .filter((value) => value !== null && value !== undefined)
        .map(Number);
      if (values.length === 0) return null;
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    };

    return {
      model_provider: first.model_provider,
      fixtures: modelRows.length,
      cases_passed: passedRows.length,
      pass_score_rows: scoredPassRows.length,
      case_pass_rate: round(passedRows.length / modelRows.length, 4),
      block_resolution_coverage: round(average("block_resolution_coverage"), 4),
      no_conflict_markers: round(average("no_conflict_markers"), 4),
      resolution_reported_success: round(
        average("resolution_reported_success"),
        4
      ),
      usage_available_count: usageRows.length,
      avg_duration_s: round(average("duration_ms") / 1000, 4),
    };
  });
}

const manifestPath = path.join(outputDir, MANIFEST_FILE);
const manifest = readJson(manifestPath);
const experiments = manifest.experiments ?? [];
const allRows = [];

for (const experiment of experiments) {
  const [summaryRows, scoreMetadataRows] = await Promise.all([
    fetchSummaryRows(experiment.experiment_id),
    fetchScoreMetadataRows(experiment.experiment_id),
  ]);
  const scoreMetadataByRoot = buildScoreMetadataByRoot(scoreMetadataRows);

  for (const row of summaryRows) {
    allRows.push(
      normalizeRow({
        experiment,
        row,
        scoreMetadata: scoreMetadataByRoot.get(row.root_span_id) ?? {},
      })
    );
  }
}

allRows.sort(compareRows(experiments));

const expectedRows = experiments.length * manifest.benchmark_fixture_count;
if (allRows.length !== expectedRows) {
  throw new Error(`Expected ${expectedRows} rows, exported ${allRows.length}`);
}

const perFixtureColumns = [
  "model_provider",
  "model",
  "fixture",
  "passes_tests",
  "resolution_reported_success",
  "no_conflict_markers",
  "block_resolution_coverage",
  "usage_available",
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
  "root_span_id",
  "result_created_at",
];

writeCsv(path.join(outputDir, PER_FIXTURE_CSV), allRows, perFixtureColumns);
fs.writeFileSync(
  path.join(outputDir, PER_FIXTURE_JSONL),
  `${allRows
    .map((row) =>
      JSON.stringify(
        Object.fromEntries(
          perFixtureColumns.map((column) => [column, row[column]])
        )
      )
    )
    .join("\n")}\n`
);

console.log(
  JSON.stringify(
    {
      rows: allRows.length,
      created_after: createdAfter,
      created_before: createdBefore,
      summaries: summarizeRows(allRows),
    },
    null,
    2
  )
);
