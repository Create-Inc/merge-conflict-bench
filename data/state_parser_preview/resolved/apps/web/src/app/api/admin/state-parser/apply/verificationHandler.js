import { jsonNoStore, writeAuditEvent, writeParserEvent } from "../utils";
import { recordApplyEvent } from "./audit";
import { touchVerifiedDatesByIds } from "./database";

export async function handleVerificationOnlyApply({
  session,
  state,
  snapshot_hash,
  parser_version_raw,
  mapping_preset,
  override_conflicts,
  override_batch,
  dry_run,
  diff,
  snapshot,
  parseLimit,
  cursor_in,
  cursor_out,
  cursor_prev,
  totalLinks,
  nextOffset,
  done,
  apply_mode,
  required_confirm,
  latency_ms,
  debugInfo,
}) {
  if (mapping_preset !== "library_only") {
    return jsonNoStore(
      {
        ok: false,
        error: "REFRESH_VERIFICATION_INVALID_PRESET",
        message:
          "Refresh verification timestamps is only supported for mapping_preset=library_only.",
        state,
      },
      { status: 400 },
    );
  }

  const hasDiffChanges =
    (Array.isArray(diff?.will_insert) ? diff.will_insert.length : 0) > 0 ||
    (Array.isArray(diff?.will_update) ? diff.will_update.length : 0) > 0;

  const hardConflictsCount = Array.isArray(diff?.conflicts)
    ? diff.conflicts.length
    : 0;
  const bootstrapConflictsCount = Array.isArray(diff?.bootstrap_conflicts)
    ? diff.bootstrap_conflicts.length
    : 0;
  const hasAnyConflicts = hardConflictsCount + bootstrapConflictsCount > 0;

  if (hasDiffChanges || hasAnyConflicts) {
    return jsonNoStore(
      {
        ok: false,
        error: "REFRESH_VERIFICATION_REQUIRES_EMPTY_DIFF",
        message:
          "Refresh verification timestamps is only allowed when Preview shows no inserts/updates/conflicts. Uncheck it to apply changes.",
        state,
      },
      { status: 409 },
    );
  }

  const idsToTouch = (Array.isArray(diff?.will_skip) ? diff.will_skip : [])
    .map((r) => Number(r?.id))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (dry_run === true) {
    const diffOut = {
      will_insert: 0,
      will_update: 0,
      will_skip: idsToTouch.length,
      conflicts: 0,
      bootstrap_conflicts: 0,
      will_touch_verified: idsToTouch.length,
    };

    const dryPayload = {
      ok: true,
      dry_run: true,
      state,
      verification_only: true,
      latency_ms: Number.isFinite(Number(latency_ms))
        ? Number(latency_ms)
        : null,

      // NEW: warnings (always present; empty array when none)
      warnings: Array.isArray(debugInfo?.warnings) ? debugInfo.warnings : [],

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
    };

    const ids = await recordApplyEvent({
      session,
      state,
      snapshot_hash,
      parser_version: parser_version_raw,
      mapping_preset,
      override_conflicts,
      override_batch,
      dry_run,
      result: dryPayload,
      counts: diffOut,
      latency_ms,
    });

    return jsonNoStore({ ...dryPayload, ...ids });
  }

  const touched_ids = await touchVerifiedDatesByIds({ ids: idsToTouch });
  const nowIso = new Date().toISOString();

  const payload = {
    ok: true,
    dry_run: false,
    state,
    verification_only: true,
    latency_ms: Number.isFinite(Number(latency_ms)) ? Number(latency_ms) : null,

    // NEW: warnings (always present; empty array when none)
    warnings: Array.isArray(debugInfo?.warnings) ? debugInfo.warnings : [],

    // STEP 6D debug
    parser_version_used: debugInfo?.parser_version_used || null,
    adapter_used: debugInfo?.adapter_used || null,
    capabilities: debugInfo?.capabilities || null,
    source_class: debugInfo?.source_class || null,

    touched_verified_count: touched_ids.length,
    touched_ids,
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
    verified_touched_at: nowIso,
  };

  const audit_event_id = await writeAuditEvent({
    user_id: session.user.id,
    event_type: "STATE_PARSER_APPLY",
    metadata: {
      state,
      snapshot: payload.snapshot,
      parser_version: parser_version_raw,
      mapping_preset,
      apply_mode,
      verification_only: true,
      touched_verified_count: payload.touched_verified_count,
      override_conflicts,
      override_batch,
      cursor: payload.cursor,
      adapter_used: payload.adapter_used,
    },
  });

  const parser_event_id = await writeParserEvent({
    state,
    event_type: "STATE_PARSER_APPLY",
    actor_user_id: session.user.id,
    snapshot_url: snapshot.url,
    snapshot_hash: snapshot.hash,
    parser_version: parser_version_raw,
    mapping_preset,
    override_conflicts,
    dry_run: false,
    counts: {
      touched_verified_count: payload.touched_verified_count,
      latency_ms: payload.latency_ms,
    },
    result: payload,
  });

  return jsonNoStore({ ...payload, audit_event_id, parser_event_id });
}
