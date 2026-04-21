/**
 * Evaluate a merge conflict resolution by running the hidden holdout tests.
 *
 * Usage:
 *   npx tsx scripts/evaluate.ts --case <case_name> --resolution-dir <path>
 *
 * The resolution dir should contain the resolved files at the same relative
 * paths as the conflicted/ directory. The evaluator copies them into a temp
 * workspace alongside the hidden test suite and runs Vitest.
 */

import {
  readFileSync,
  readdirSync,
  existsSync,
  cpSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { parseArgs } from 'node:util';
import type { ConflictEvalConfig, EvalConfig } from '../schemas';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    case: { type: 'string' },
    'resolution-dir': { type: 'string' },
    'data-dir': { type: 'string', default: join(__dirname, '..', 'data') },
    verbose: { type: 'boolean', default: false },
  },
});

if (!args.case || !args['resolution-dir']) {
  console.error('Usage: evaluate.ts --case <name> --resolution-dir <path>');
  process.exit(1);
}

const CASE_DIR = join(args['data-dir']!, args.case!);
const RESOLUTION_DIR = args['resolution-dir']!;
const VERBOSE = args.verbose!;

// ---------------------------------------------------------------------------
// Load case config
// ---------------------------------------------------------------------------

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

const evalConfig = loadJson<EvalConfig>(join(CASE_DIR, 'eval.config.json'));
const conflictEvalConfig = loadJson<ConflictEvalConfig>(
  join(CASE_DIR, 'conflict_eval.config.json')
);

// ---------------------------------------------------------------------------
// Check for conflict markers
// ---------------------------------------------------------------------------

const CONFLICT_MARKER_PATTERN = /^<{7}\s|^={7}$|^>{7}\s/m;

function readAllFiles(dir: string): Record<string, string> {
  const files: Record<string, string> = {};
  function walk(current: string) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files[relative(dir, fullPath)] = readFileSync(fullPath, 'utf8');
      }
    }
  }
  if (existsSync(dir)) walk(dir);
  return files;
}

function checkNoConflictMarkers(files: Record<string, string>): boolean {
  for (const [path, content] of Object.entries(files)) {
    if (CONFLICT_MARKER_PATTERN.test(content)) {
      console.log(`  Conflict markers found in: ${path}`);
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Run hidden tests
// ---------------------------------------------------------------------------

function runTests(caseDir: string, resolutionDir: string): boolean {
  const testFile = conflictEvalConfig.testFile;
  const testPath = join(caseDir, testFile);

  if (!existsSync(testPath)) {
    console.log(`  No test file found at ${testFile}`);
    return false;
  }

  // Create a temp workspace: copy the resolved files + the test file
  const workspace = mkdtempSync(join(tmpdir(), 'mcb-eval-'));

  try {
    // Copy resolved source files
    cpSync(resolutionDir, workspace, { recursive: true });

    // Copy the hidden test file
    cpSync(testPath, join(workspace, testFile));

    // Run vitest
    const cmd = `npx vitest run --reporter=verbose ${testFile}`;

    if (VERBOSE) {
      console.log(`  Running: ${cmd}`);
      console.log(`  Workspace: ${workspace}`);
    }

    const output = execSync(cmd, {
      cwd: workspace,
      stdio: VERBOSE ? 'inherit' : 'pipe',
      timeout: 30_000,
    });

    if (!VERBOSE && output) {
      // Count pass/fail from output
      const text = output.toString();
      const passMatch = text.match(/(\d+) passed/);
      if (passMatch) {
        console.log(`  ${passMatch[0]}`);
      }
    }

    return true;
  } catch (error) {
    if (VERBOSE) {
      console.error('  Test execution failed:', (error as Error).message);
    }
    return false;
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log(`Case: ${evalConfig.name}`);
  console.log(`Description: ${evalConfig.description}`);
  console.log(`Conflict blocks: ${evalConfig.conflictBlockCount}`);
  console.log(`Preserved behaviors: ${conflictEvalConfig.preservedBehaviors.length}`);

  for (const behavior of conflictEvalConfig.preservedBehaviors) {
    console.log(`  [${behavior.origin}] ${behavior.description}`);
  }

  console.log('');

  // Score 1: No conflict markers
  const resolutionFiles = readAllFiles(RESOLUTION_DIR);
  const noMarkers = checkNoConflictMarkers(resolutionFiles);
  console.log(`No conflict markers: ${noMarkers ? 'PASS' : 'FAIL'}`);

  // Score 2: Hidden tests pass
  const testsPass = runTests(CASE_DIR, RESOLUTION_DIR);
  console.log(`Tests pass:          ${testsPass ? 'PASS' : 'FAIL'}`);

  // Summary
  const passed = noMarkers && testsPass;
  console.log(`\nResult: ${passed ? 'PASS' : 'FAIL'}`);

  process.exit(passed ? 0 : 1);
}

main();
