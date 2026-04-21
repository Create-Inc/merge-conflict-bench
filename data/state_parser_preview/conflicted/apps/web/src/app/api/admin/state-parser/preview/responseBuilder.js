import { jsonNoStore, writeAuditEvent, writeParserEvent } from "../utils";

function pickSample(list, n) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, n);
}

function getSnapshotContentType({ cfg }) {
  const klass = String(cfg?.source_class || "")
    .trim()
    .toLowerCase();

  if (klass === "pdf") return "application/pdf";
  if (klass === "hybrid") return "hybrid/*";
  return "text/html";
}

export async function buildSuccessResponse({
  state,
  snapshot,
  diff,
  links,
  parsedRules,
  pagesFetched,
  batch_size,
  dry_run,
  session,
  parser_version,
  mapping_preset,
  cfg,
  cursor_in,
  cursor_out,
  cursor_prev,
  link_count_scanned,
  done,
  effective_limit,
  // NEW: latency tracking (used by /state-parser/health)
  latency_ms,

  // NEW: non-blocking warnings (e.g. adapter_hint drift)
  warnings,

  // STEP 6D debug (optional, but preferred)
  parser_version_used,
  adapter_used,
  capabilities,
  source_class,

  // NEW: drift/diagnostic warnings (non-blocking)
  warnings,
}) {
  const insertOnly =
    String(mapping_preset || "library_only") === "library_only";

  const diffSummary = insertOnly
    ? {
        will_insert: diff.will_insert.length,
        // In library_only/insert_only, updates are implemented as REPLACE (deactivate + insert).
        will_replace: diff.will_update.length,
        will_skip: diff.will_skip.length,
        conflicts: diff.conflicts.length,
      }
    : {
        will_insert: diff.will_insert.length,
        will_update: diff.will_update.length,
        will_skip: diff.will_skip.length,
        conflicts: diff.conflicts.length,
      };

  const predicted = {
    library_rules_delta: diff.will_insert.length,
    intended_executable_delta: diff.will_update.filter((r) => r.execution_type)
      .length,
    executor_ready_delta: diff.will_update.filter(
      (r) => r.rule_type === "timing" || r.rule_type === "service",
    ).length,
  };

  const required_confirm_apply = `APPLY PARSER ${state}`;

  const snapshot_content_type = getSnapshotContentType({ cfg });
  const snapshotContentTypeFinal =
    snapshot?.content_type || snapshot_content_type || null;

  // Prefer adapter-based debug instead of state-based debug.
  const adapterName = String(adapter_used || cfg?.adapter || "").trim();

  const successDebug =
    adapterName === "PatternHtmlIndexHtmlRuleAdapter" ||
    adapterName === "PatternP5NjAdapter"
      ? {
          selector_used:
            snapshot?.nj_debug?.selector_used ||
            "HTML/JSON: index discovery + rule parsing",
          sample_links_found: pickSample(links, 10),
          rule_tokens_found_count: Number(
            snapshot?.nj_debug?.rule_tokens_found_count ??
              (Array.isArray(links) ? links.length : 0),
          ),
          rules_parsed_count: parsedRules.length,
        }
      : adapterName === "PatternP4MultiIndexAdapter"
        ? {
            selector_used:
              "HTML multi-index: root -> title pages -> rule pages",
            sample_links_found: pickSample(links, 10),
            rules_parsed_count: parsedRules.length,
          }
        : adapterName === "HtmlSingleIndexAdapter"
          ? {
              selector_used: "HTML single-index: anchor scan -> rule pages",
              sample_links_found: pickSample(links, 10),
              rules_parsed_count: parsedRules.length,
            }
          : null;

  // Adapter-specific counters (builder-safe contract)
  const rules_parsed = Number.isFinite(Number(parsedRules?.length))
    ? Number(parsedRules.length)
    : 0;

  // HTML counters (prefer snapshot-provided hints when available)
  const indexCandidatesTotalRaw =
    snapshot?.index_candidates_total ??
    snapshot?.nj_debug?.candidates_found ??
    snapshot?.nj_debug?.subtree_json?.candidates_found ??
    snapshot?.nj_debug?.subtree_candidates_found ??
    null;

  const indexCandidatesSelectedRaw =
    snapshot?.index_candidates_selected ??
    snapshot?.nj_debug?.selected_for_fetch ??
    snapshot?.nj_debug?.subtree_selected_for_fetch ??
    null;

  const index_candidates_total = Number.isFinite(
    Number(indexCandidatesTotalRaw),
  )
    ? Number(indexCandidatesTotalRaw)
    : null;

  const index_candidates_selected = Number.isFinite(
    Number(indexCandidatesSelectedRaw),
  )
    ? Number(indexCandidatesSelectedRaw)
    : null;

  // PDF/Hybrid counters (MUST be present; null allowed)
  const pdf_units_total = snapshot?.pdf_units_total ?? null;
  const pdf_units_scanned = snapshot?.pdf_units_scanned ?? null;
  const pdf_links_total = snapshot?.pdf_links_total ?? null;
  const pdf_links_scanned = snapshot?.pdf_links_scanned ?? null;

  const payload = {
    ok: true,
    dry_run: Boolean(dry_run),
    state,

    // NEW: timing metric
    latency_ms: Number.isFinite(Number(latency_ms)) ? Number(latency_ms) : null,

<<<<<<< ours
    // NEW: non-blocking warnings for observability
    warnings: Array.isArray(warnings) ? warnings : [],

=======
    // NEW: warnings (always present; empty array when none)
    warnings: Array.isArray(warnings) ? warnings : [],

>>>>>>> theirs
    // STEP 6D debug (root-level, always present when provided)
    parser_version_used: parser_version_used || parser_version,
    adapter_used: adapter_used || cfg?.adapter || null,
    capabilities: capabilities || null,
    source_class: source_class || cfg?.source_class || null,

    // --- Mandatory preview debug counters (root-level; never omit) ---
    effective_limit: Number.isFinite(Number(effective_limit))
      ? Number(effective_limit)
      : Number(batch_size),
    cursor_in: cursor_in || null,
    cursor_out: cursor_out || null,
    next_cursor: cursor_out || null,
    prev_cursor: cursor_prev || null,
    done: Boolean(done),

    // Adapter-specific counters
    index_candidates_total,
    index_candidates_selected,
    pdf_units_total,
    pdf_units_scanned,
    pdf_links_total,
    pdf_links_scanned,
    rules_parsed,

    // Snapshot pinning contract
    snapshot_hash: snapshot.hash,
    snapshot_url: snapshot.url,
    snapshot_content_type: snapshotContentTypeFinal,
    snapshot_fetched_at: snapshot.fetched_at,

    snapshot: {
      url: snapshot.url,
      hash: snapshot.hash,
      fetched_at: snapshot.fetched_at,
      content_type: snapshotContentTypeFinal,
    },
    cursor: {
      cursor_in: cursor_in || null,
      cursor_out: cursor_out || null,
      next_cursor: cursor_out || null,
      prev_cursor: cursor_prev || null,
      effective_limit: Number.isFinite(Number(effective_limit))
        ? Number(effective_limit)
        : Number(batch_size),
      link_count_total: Array.isArray(links) ? links.length : 0,
      link_count_scanned: Number.isFinite(Number(link_count_scanned))
        ? Number(link_count_scanned)
        : null,
      done: Boolean(done),
    },
    diff: diffSummary,
    sample: insertOnly
      ? {
          inserts: pickSample(diff.will_insert, 5),
          replaces: pickSample(diff.will_update, 5),
          conflicts: pickSample(diff.conflicts, 5),
        }
      : {
          inserts: pickSample(diff.will_insert, 5),
          updates: pickSample(diff.will_update, 5),
          conflicts: pickSample(diff.conflicts, 5),
        },
    predicted_coverage_delta: predicted,
    required_confirm_apply,
    debug: successDebug,
    notes: {
      adapter: cfg.adapter,
      pattern_id: cfg.pattern_id || null,
      child_pattern_id: cfg.child_pattern_id || null,
      index_url: cfg.index_url,
      root_index_url: cfg.root_index_url || null,
      pages_fetched: pagesFetched || Math.min(50, batch_size),
      rules_parsed: parsedRules.length,
      link_count_total: Array.isArray(links) ? links.length : 0,
      index_candidates_total,
      index_candidates_selected,
    },
  };

  const audit_event_id = await writeAuditEvent({
    user_id: session.user.id,
    event_type: "STATE_PARSER_PREVIEW",
    metadata: {
      state,
      snapshot: payload.snapshot,
      parser_version,
      mapping_preset,
      diff: payload.diff,
      predicted_coverage_delta: predicted,
      cursor: payload.cursor,
    },
  });

  const storedResult = {
    ...payload,
    snapshot_html: snapshot?.html || null,
    snapshot_text: snapshot?.text || null,
    snapshot_fetched_at: snapshot?.fetched_at || null,
    snapshot_links: Array.isArray(links) ? links : [],
    snapshot_content_type: snapshotContentTypeFinal,
  };

  const parser_event_id = await writeParserEvent({
    state,
    event_type: "STATE_PARSER_PREVIEW",
    actor_user_id: session.user.id,
    snapshot_url: snapshot.url,
    snapshot_hash: snapshot.hash,
    parser_version,
    mapping_preset,
    override_conflicts: false,
    dry_run: true,
    counts: { ...payload.diff, latency_ms: payload.latency_ms },
    result: storedResult,
  });

  return jsonNoStore({ ...payload, audit_event_id, parser_event_id });
}
