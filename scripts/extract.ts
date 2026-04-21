/**
 * Extract merge conflict cases from BigQuery into the benchmark format.
 *
 * Usage:
 *   doppler run --project flux-worker --config prd -- \
 *     npx tsx merge-conflict-bench/scripts/extract.ts [--limit 50] [--min-blocks 2]
 *
 * All data comes from BigQuery — no S3 access needed. The resolution_details
 * and merge_conflicts JSON fields contain the full file contents.
 */

import { BigQuery } from '@google-cloud/bigquery';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import type { EvalConfig, ConflictEvalConfig, ConflictBlock } from '../schemas';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    limit: { type: 'string', default: '100' },
    'min-blocks': { type: 'string', default: '1' },
    'output-dir': { type: 'string', default: join(__dirname, '..', 'data') },
    'dry-run': { type: 'boolean', default: false },
  },
});

const LIMIT = parseInt(args.limit!, 10);
const MIN_BLOCKS = parseInt(args['min-blocks']!, 10);
const OUTPUT_DIR = args['output-dir']!;
const DRY_RUN = args['dry-run']!;

// ---------------------------------------------------------------------------
// BigQuery client
// ---------------------------------------------------------------------------

const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const bigquery = googleCreds
  ? new BigQuery({ credentials: JSON.parse(googleCreds) })
  : new BigQuery();

// ---------------------------------------------------------------------------
// Query for interesting resolved conflicts
// ---------------------------------------------------------------------------

type ConflictRow = {
  conflict_id: string;
  project_group_id: string;
  conflict_count: number;
  log_timestamp: { value: string };
  resolution_details: string;
  resolution_accepted_ours_count: number;
  resolution_accepted_theirs_count: number;
  resolution_accepted_both_count: number;
  resolution_custom_count: number;
  merge_conflicts: string;
};

async function queryInterestingConflicts(): Promise<ConflictRow[]> {
  const query = `
    WITH resolution_summary AS (
      SELECT
        merge_conflict_id,
        ARRAY_AGG(resolution_details ORDER BY timestamp DESC LIMIT 1)[OFFSET(0)] AS resolution_details,
        SUM(resolution_accepted_ours_count) AS resolution_accepted_ours_count,
        SUM(resolution_accepted_theirs_count) AS resolution_accepted_theirs_count,
        SUM(resolution_accepted_both_count) AS resolution_accepted_both_count,
        SUM(resolution_custom_count) AS resolution_custom_count,
        SUM(resolution_unresolved_count) AS resolution_unresolved_count,
      FROM \`generation.merge_fs_conflict_resolution_results\`
      GROUP BY merge_conflict_id
    )
    SELECT
      fc.conflict_id,
      fc.project_group_id,
      fc.conflict_count,
      fc.log_timestamp,
      fc.conflicts AS merge_conflicts,
      rs.resolution_details,
      rs.resolution_accepted_ours_count,
      rs.resolution_accepted_theirs_count,
      rs.resolution_accepted_both_count,
      rs.resolution_custom_count,
    FROM \`generation.fs_conflict_results\` fc
    JOIN resolution_summary rs ON fc.conflict_id = rs.merge_conflict_id
    WHERE
      fc.merge_failed = FALSE
      AND fc.conflict_count >= ${MIN_BLOCKS}
      AND rs.resolution_unresolved_count = 0
      AND (rs.resolution_custom_count > 0 OR rs.resolution_accepted_both_count > 0)
    ORDER BY
      rs.resolution_custom_count DESC,
      rs.resolution_accepted_both_count DESC,
      fc.conflict_count DESC
    LIMIT ${LIMIT}
  `;

  console.log(`Querying BigQuery for up to ${LIMIT} interesting conflicts...`);
  const [rows] = await bigquery.query({ query });
  console.log(`Found ${rows.length} candidates`);
  return rows as ConflictRow[];
}

// ---------------------------------------------------------------------------
// Parse BigQuery data into case structure
// ---------------------------------------------------------------------------

type ParsedCase = {
  conflictedFiles: Record<string, string>; // file path → content with markers
  resolvedFiles: Record<string, string>; // file path → resolved content
  conflictBlocks: ConflictBlock[];
  fileList: string[];
};

function parseCase(row: ConflictRow): ParsedCase | null {
  const conflictedFiles: Record<string, string> = {};
  const resolvedFiles: Record<string, string> = {};
  const conflictBlocks: ConflictBlock[] = [];
  const fileList: string[] = [];

  // Parse merge_conflicts → conflicted files with markers
  try {
    const conflicts = JSON.parse(row.merge_conflicts) as Record<
      string,
      { content: string; wasDeleted: boolean }
    >;
    for (const [filePath, conflict] of Object.entries(conflicts)) {
      if (!conflict.wasDeleted && conflict.content) {
        conflictedFiles[filePath] = conflict.content;
        fileList.push(filePath);
      }
    }
  } catch {
    return null;
  }

  // Parse resolution_details → resolved files + per-block info
  try {
    const details = JSON.parse(row.resolution_details) as Array<{
      filePath: string;
      wasDeleted: boolean;
      conflictBlocks: Array<{
        blockIndex: number;
        oursContent: string;
        theirsContent: string;
        conflictBlockContent: string;
        currentFileContent: string;
        strategy: string;
      }>;
    }>;

    for (const file of details) {
      if (file.wasDeleted) continue;

      // Get the resolved content from the last block (all blocks reference
      // the same file-level content)
      const lastBlock = file.conflictBlocks[file.conflictBlocks.length - 1];
      if (lastBlock?.currentFileContent) {
        resolvedFiles[file.filePath] = lastBlock.currentFileContent;
      }

      for (const block of file.conflictBlocks) {
        conflictBlocks.push({
          blockIndex: block.blockIndex,
          filePath: file.filePath,
          oursContent: block.oursContent,
          theirsContent: block.theirsContent,
        });
      }
    }
  } catch {
    return null;
  }

  if (fileList.length === 0 || Object.keys(resolvedFiles).length === 0) {
    return null;
  }

  return { conflictedFiles, resolvedFiles, conflictBlocks, fileList };
}

// ---------------------------------------------------------------------------
// Detect language from file extensions
// ---------------------------------------------------------------------------

function detectLanguage(
  files: Record<string, string>
): EvalConfig['language'] {
  const extensions = Object.keys(files).map((p) =>
    p.split('.').pop()?.toLowerCase()
  );
  if (extensions.some((e) => e === 'tsx' || e === 'ts')) return 'typescript';
  if (extensions.some((e) => e === 'jsx' || e === 'js')) return 'javascript';
  if (extensions.some((e) => e === 'css')) return 'css';
  if (extensions.some((e) => e === 'json')) return 'json';
  return 'other';
}

function slugify(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60);
}

// ---------------------------------------------------------------------------
// Write files to disk
// ---------------------------------------------------------------------------

function writeFilesMap(dir: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    // Normalize path — remove leading slash
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    const fullPath = join(dir, normalized);
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, content, 'utf8');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const rows = await queryInterestingConflicts();

  if (DRY_RUN) {
    console.log('\nDry run — would extract these cases:\n');
    for (const row of rows) {
      console.log(
        `  ${row.conflict_id} — ${row.conflict_count} conflicts, ` +
          `custom=${row.resolution_custom_count}, both=${row.resolution_accepted_both_count}`
      );
    }
    return;
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  let extracted = 0;
  let skipped = 0;
  for (const row of rows) {
    const caseName = slugify(row.conflict_id);
    const caseDir = join(OUTPUT_DIR, caseName);

    if (existsSync(caseDir)) {
      console.log(`  Skipping ${caseName} (already exists)`);
      continue;
    }

    console.log(
      `\nExtracting ${caseName} (${row.conflict_count} conflicts)...`
    );

    const parsed = parseCase(row);
    if (!parsed) {
      console.log(`  Skipping — could not parse conflict data`);
      skipped++;
      continue;
    }

    // Write case to disk
    mkdirSync(caseDir, { recursive: true });

    // Write conflicted files (agent input — files with <<<<<<< markers)
    writeFilesMap(join(caseDir, 'conflicted'), parsed.conflictedFiles);

    // Write resolved files (reference — for test authoring, not given to agent)
    writeFilesMap(join(caseDir, 'resolved'), parsed.resolvedFiles);

    // Write eval.config.json
    const evalConfig: EvalConfig = {
      name: caseName,
      description: `Merge conflict with ${row.conflict_count} conflict(s) across ${parsed.fileList.length} file(s)`,
      sourceConflictId: row.conflict_id,
      sourceTimestamp: row.log_timestamp.value,
      language: detectLanguage(parsed.conflictedFiles),
      conflictedFileCount: parsed.fileList.length,
      conflictBlockCount: parsed.conflictBlocks.length,
    };
    writeFileSync(
      join(caseDir, 'eval.config.json'),
      JSON.stringify(evalConfig, null, 2) + '\n',
      'utf8'
    );

    // Write conflict_eval.config.json
    const conflictEvalConfig: ConflictEvalConfig = {
      conflictBlocks: parsed.conflictBlocks,
      conflictedFiles: parsed.fileList,
      testFile: 'merge.test.js',
      preservedBehaviors: [],
    };
    writeFileSync(
      join(caseDir, 'conflict_eval.config.json'),
      JSON.stringify(conflictEvalConfig, null, 2) + '\n',
      'utf8'
    );

    extracted++;
    console.log(`  Wrote ${caseName} (${parsed.conflictBlocks.length} blocks across ${parsed.fileList.length} files)`);
  }

  console.log(`\nDone. Extracted ${extracted} cases, skipped ${skipped}.`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(
    `\nNext: author hidden tests (merge.test.js) and preserved behaviors for each case.`
  );
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
