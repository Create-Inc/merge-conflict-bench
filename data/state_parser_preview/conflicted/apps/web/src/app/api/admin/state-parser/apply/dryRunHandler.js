import { jsonNoStore } from "../utils";
import { recordApplyEvent } from "./audit";

export async function handleDryRun({
  session,
  state,
  snapshot_hash,
  parser_version_raw,
  mapping_preset,
  override_conflicts,
  override_batch,
  willInsert,
  willUpdate,
  willReplace,
  bootstrapConflicts,
  diff,
  apply_mode,
  isInsertOnly,
  snapshot,
  parseLimit,
  cursor_in,
  cursor_out,
  cursor_prev,
  totalLinks,
  nextOffset,
  done,
  required_confirm,
  remaining,
  isSandboxStaging,
  latency_ms,
  debugInfo,
}) {
  let diffOut;

  if (isSandboxStaging || mapping_preset === "pdf_sandbox") {
    diffOut = {
      staging_inserted: Array.isArray(willInsert) ? willInsert.length : 0,
    };
  } else {
    diffOut = isInsertOnly
      ? {
          will_insert: willInsert.length,
          will_replace: willUpdate.length,
          will_skip: diff.will_skip.length,
          conflicts: willReplace.length,
          bootstrap_conflicts: bootstrapConflicts.length,
        }
      : {
          will_insert: willInsert.length,
          will_update: willUpdate.length,
          will_skip: diff.will_skip.length,
          conflicts: willReplace.length,
          bootstrap_conflicts: bootstrapConflicts.length,
        };
  }

  const dryPayload = {
    ok: true,
    dry_run: true,
    state,

    // NEW: timing metric
    latency_ms: Number.isFinite(Number(latency_ms)) ? Number(latency_ms) : null,

<<<<<<< ours
    // NEW: non-blocking warnings for observability
    warnings: Array.isArray(debugInfo?.warnings) ? debugInfo.warnings : [],

=======
    // NEW: warnings (always present; empty array when none)
    warnings: Array.isArray(debugInfo?.warnings) ? debugInfo.warnings : [],

>>>>>>> theirs
    // STEP 6D debug
    parser_version_used: debugInfo?.parser_version_used || null,
    adapter_used: debugInfo?.adapter_used || null,
    capabilities: debugInfo?.capabilities || null,
    source_class: debugInfo?.source_class || null,

    snapshot_hash: snapshot.hash,
    effective_limit: parseLimit,
    cursor_in,
    cursor_out,
    next_cursor: cursor_out,
    prev_cursor: cursor_prev,

    snapshot: {
      url: snapshot.url,
      hash: snapshot.hash,
      fetched_at: snapshot.fetched_at,
      content_type: snapshot?.content_type || null,
    },
    cursor: {
      cursor_in,
      cursor_out,
      next_cursor: cursor_out,
      prev_cursor: cursor_prev,
      effective_limit: parseLimit,
      link_count_total: totalLinks,
      link_count_scanned: nextOffset,
      done,
    },

    apply_mode,
    diff: diffOut,
    required_confirm_apply: required_confirm,
    remaining,
  };

  const ids = await recordApplyEvent({
    session,
    state,
    snapshot_hash,
    parser_version: parser_version_raw,
    mapping_preset,
    override_conflicts,
    override_batch,
    dry_run: true,
    result: dryPayload,
    counts: dryPayload.diff,
    latency_ms,
  });

  return jsonNoStore({ ...dryPayload, ...ids });
}
