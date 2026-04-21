/**
 * Schema definitions for MergeConflictBench case configs.
 *
 * These types define the on-disk JSON format for each benchmark case.
 * They are used by both the extraction script and the evaluation harness.
 */

// ---------------------------------------------------------------------------
// eval.config.json — case metadata
// ---------------------------------------------------------------------------

export type EvalConfig = {
  /** Unique case identifier (matches directory name) */
  name: string;
  /** Human-readable description of what the conflict involves */
  description: string;
  /** Source conflict ID from production tracking */
  sourceConflictId: string;
  /** When the conflict was originally recorded */
  sourceTimestamp: string;
  /** Language / framework of the conflicting files */
  language: 'typescript' | 'javascript' | 'css' | 'json' | 'other';
  /** Number of files with conflicts */
  conflictedFileCount: number;
  /** Total number of conflict blocks across all files */
  conflictBlockCount: number;
};

// ---------------------------------------------------------------------------
// conflict_eval.config.json — conflict details + hidden test config
// ---------------------------------------------------------------------------

export type ConflictBlock = {
  /** Index of this block within the file */
  blockIndex: number;
  /** File path relative to the case root */
  filePath: string;
  /** The ours side of the conflict */
  oursContent: string;
  /** The theirs side of the conflict */
  theirsContent: string;
};

export type PreservedBehavior = {
  /** Which branch introduced this behavior */
  origin: 'base' | 'ours' | 'theirs';
  /** Human-readable description of the behavior that must be preserved */
  description: string;
};

export type ConflictEvalConfig = {
  /** All conflict blocks in this case */
  conflictBlocks: ConflictBlock[];
  /** Files that have conflicts (relative paths) */
  conflictedFiles: string[];
  /** Path to the hidden test file (relative to case dir) */
  testFile: string;
  /** Behaviors the hidden tests verify — the "contract" of a correct merge */
  preservedBehaviors: PreservedBehavior[];
};
