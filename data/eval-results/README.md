# MergeConflictBench Computed Results

This directory contains computed release-time metadata, reference-validation results, and model-matrix summaries used by the paper.

## Files

- `mergeconflictbench_reference_validation.json` — Vitest JSON report from running every checked-in `merge.test.js` against the checked-in `resolved/` reference files.
- `mergeconflictbench_case_summary.csv` — one row per benchmark case, generated from `eval.config.json`, `conflict_eval.config.json`, and the reference-validation JSON.
- `mergeconflictbench_tier_summary.csv` — aggregate case/file/block/test counts by complexity tier.
- `mergeconflictbench_naive_baselines.csv` — aggregate hidden-test pass rates for deterministic accept-ours, accept-theirs, and accept-both baselines.
- `mergeconflictbench_naive_baselines_per_case.csv` — per-case baseline outcomes.
- `mergeconflictbench_accept_*_validation.json` — Vitest JSON reports for the deterministic baselines.
- `mergeconflictbench_agent_full_run_summary.csv` — aggregate model pass rates and diagnostic metrics for the one-shot Escher model matrix.
- `mergeconflictbench_agent_full_run_manifest.json` — Braintrust experiment IDs and reproducibility notes for the committed model-summary artifact.
- `mergeconflictbench_agent_full_run_per_fixture.csv` — optional sanitized one-row-per-model-and-fixture result table from raw Escher exports. Not required for the paper tables.
- `mergeconflictbench_agent_full_run_per_fixture.jsonl` — optional JSON Lines copy of the sanitized per-fixture rows.

## Regeneration

```bash
npx -p vitest@4.1.8 -p jsdom vitest run \
  --reporter=json \
  --outputFile=data/eval-results/mergeconflictbench_reference_validation.json \
  data/*/merge.test.js

node scripts/summarize-corpus.mjs

node scripts/evaluate-naive-baselines.mjs

node scripts/sanitize-agent-eval-results.mjs raw-eval-results data/eval-results
```

The `jsdom` package is required for `celebration_overlay`, which uses a browser-like test environment.

The agent sanitizer expects raw Escher eval exports with `experiments`, `results`, and `scores` arrays. It intentionally drops raw prompts, generated resolved files, and hidden-test messages while preserving per-fixture scores, token metadata, failure buckets, and source export identifiers.

The committed model-summary CSV was computed from Braintrust's one-row-per-fixture summary view for the following Escher experiments:

- `openai-gpt-4.1`: `0ea8ae12-ef6f-41bf-ae48-855ec36663b9`
- `anthropic-opus-4.6`: `b2f6786f-07b0-4ecb-b196-bcf231952378`
- `anthropic-sonnet-4.6`: `2ba64133-4a63-452b-9599-633688193cb1`
- `google-2.5-flash`: `927e4e8b-4a1a-42ca-b27b-360f1137f0ab`
- `google-2.5-pro`: `c94b3174-f020-44a0-86be-2f0f75755730`

For paper case pass rates, missing or unscored `Passes Tests` rows are counted as failures because the benchmark metric is performance across all 86 fixtures.
