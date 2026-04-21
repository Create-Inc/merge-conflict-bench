import { jsonNoStore, writeAuditEvent, writeParserEvent } from "../utils";
import {
  ensureRuleSource,
  applyDatabaseChanges,
  getPostCheckSample,
  deactivateBootstrapShadowedRules,
} from "./database";
import { coverageCounts } from "./coverage";
import { canonicalizeCourtType } from "@/utils/canonicalRules";

export async function handleLiveApply({
  session,
  state,
  snapshot_hash,
  parser_version_raw,
  mapping_preset,
  override_conflicts,
  override_batch,
  willUpdateCapped,
  willInsertCapped,
  willReplace,
  cfg,
  parsedRules,
  existingByRuleNumber,
  apply_mode,
  snapshot,
  parseLimit,
  cursor_in,
  cursor_out,
  cursor_prev,
  totalLinks,
  nextOffset,
  done,
  remaining,
  requested,
  isSandboxStaging,
  latency_ms,
  debugInfo,
}) {
  // pdf_sandbox: write into staging only, skip coverage + bootstrap cleanup.
  if (isSandboxStaging || mapping_preset === "pdf_sandbox") {
    const out = await applyDatabaseChanges({
      willUpdate: [],
      willInsert: willInsertCapped,
      willReplace: [],
      override_conflicts: false,
      state,
      cfg,
      source_id: null,
      parsedRules,
      existingByRuleNumber: {},
      apply_mode,
      mapping_preset,
      cursor_in,
      snapshot_hash,
      parser_version_raw,
    });

    const payload = {
      ok: true,
      dry_run: false,
      state,

      // NEW: timing metric
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
      staging_batch_id: out.staging_batch_id,
      staging_inserted_count: out.staging_inserted_count,
      staging_inserted_ids: out.staging_inserted_ids,
      remaining,
      requested,
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
        staging_inserted_count: payload.staging_inserted_count,
        override_conflicts: false,
        override_batch,
        remaining,
        requested,
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
      override_conflicts: false,
      dry_run: false,
      counts: {
        staging_inserted_count: payload.staging_inserted_count,
        latency_ms: payload.latency_ms,
      },
      result: payload,
    });

    return jsonNoStore({ ...payload, audit_event_id, parser_event_id });
  }

  const source_id = await ensureRuleSource({ state, cfg });

  const {
    inserted_ids,
    updated_ids,
    replaced_old_ids,
    bootstrap_deactivated_ids,
    skipped_updates,
    skipped_inserts,
  } = await applyDatabaseChanges({
    willUpdate: willUpdateCapped,
    willInsert: willInsertCapped,
    willReplace,
    override_conflicts,
    state,
    cfg,
    source_id,
    parsedRules,
    existingByRuleNumber,
    apply_mode,
    mapping_preset,
    cursor_in,
    snapshot_hash,
    parser_version_raw,
  });

  const canonicalCourtType = canonicalizeCourtType(state, cfg.court_type);

  const appliedRuleNumbers = [
    ...willInsertCapped.map((r) => r.rule_number),
    ...willUpdateCapped.map((r) => r.rule_number),
    ...willReplace.map((r) => r.rule_number),
  ];

  const cleanup = await deactivateBootstrapShadowedRules({
    state,
    canonicalCourtType,
    ruleSet: cfg.rule_set,
    canonicalRuleNumbers: appliedRuleNumbers,
    parser_source_id: source_id,
  });

  const coverage_after = await coverageCounts(state);
  const post_check_sample = await getPostCheckSample({
    updated_ids,
    inserted_ids,
  });

  const nowIso = new Date().toISOString();

  const payload = {
    ok: true,
    dry_run: false,
    state,

    // NEW: timing metric
    latency_ms: Number.isFinite(Number(latency_ms)) ? Number(latency_ms) : null,

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
    inserted_count: inserted_ids.length,
    updated_count: updated_ids.length,
    replaced_count: replaced_old_ids.length,
    inserted_ids,
    updated_ids,
    replaced_old_ids,
    bootstrap_deactivated_ids,
    bootstrap_deactivated_count: bootstrap_deactivated_ids.length,
    bootstrap_cleanup_deactivated_ids: cleanup.deactivated_ids,
    bootstrap_cleanup_deactivated_count: cleanup.deactivated_ids.length,
    skipped_updates_count: Array.isArray(skipped_updates)
      ? skipped_updates.length
      : 0,
    skipped_inserts_count: Array.isArray(skipped_inserts)
      ? skipped_inserts.length
      : 0,
    post_check_sample,
    coverage_checked_at: nowIso,
    coverage_after,
    remaining,
    requested,
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
      inserted_count: payload.inserted_count,
      updated_count: payload.updated_count,
      replaced_count: payload.replaced_count,
      override_conflicts,
      override_batch,
      remaining,
      requested,
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
      inserted_count: payload.inserted_count,
      updated_count: payload.updated_count,
      replaced_count: payload.replaced_count,
      skipped_updates_count: payload.skipped_updates_count,
      skipped_inserts_count: payload.skipped_inserts_count,
      latency_ms: payload.latency_ms,
    },
    result: payload,
  });

  return jsonNoStore({ ...payload, audit_event_id, parser_event_id });
}
