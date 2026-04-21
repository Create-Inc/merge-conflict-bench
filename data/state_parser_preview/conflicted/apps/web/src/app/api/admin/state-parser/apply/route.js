import { requireAdminSessionOrReturnResponse } from "../utils";
import { loadExistingRulesByCanonical, computeDiff } from "../diff";
import { loadSavedConfig, buildCfgForApply } from "./config";
import { fetchSnapshot } from "./snapshot";
import { parseRules } from "./parsers";
import { parseApplyRequest } from "./requestParser";
import { computeCursorBookkeeping } from "./cursorManager";
import { handleVerificationOnlyApply } from "./verificationHandler";
import { processDiffForApplyMode, capBatchSizes } from "./diffProcessor";
import { handleDryRun } from "./dryRunHandler";
import { handleLiveApply } from "./liveApplyHandler";
import {
  runValidations,
  runSnapshotValidation,
  runParsedRulesValidation,
  runConflictValidations,
  runBatchLimitValidation,
} from "./validationRunner";
import { handleApplyError } from "./errorHandler";
import { normalizeMappingPresetForEngine } from "../presets";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { ok, response, session } = await requireAdminSessionOrReturnResponse();
  if (!ok) return response;

  const startedAt = Date.now();

  try {
    const body = await request.json().catch(() => ({}));

    const params = parseApplyRequest(body);

    const {
      state,
      snapshot_hash,
      parser_version_raw,
      mapping_preset: mapping_preset_ui,
      update_last_verified,
      cursor,
      offset,
      cursor_in,
      requestedLimit,
      apply_mode,
      confirm,
      dry_run,
      override_conflicts,
      override_conflicts_confirm,
      override_batch,
      override_batch_confirm,
      required_confirm,
      required_override_conflicts,
      required_override_batch,
    } = params;

    // NEW: UI preset -> engine preset normalization (prevents NJ-only preset logic leaking)
    const mapping_preset_engine = normalizeMappingPresetForEngine({
      state,
      mapping_preset: mapping_preset_ui,
    });

    // Guardrail: cursor must be snapshot-pinned (prevents repeats/skips across snapshot changes).
    const cursorSnapshotHash =
      String(cursor?.snapshot_hash || "").trim() || null;
    if (cursorSnapshotHash && cursorSnapshotHash !== snapshot_hash) {
      return Response.json(
        {
          ok: false,
          error: "CURSOR_SNAPSHOT_MISMATCH",
          message:
            "cursor_in belongs to a different snapshot_hash. Re-run Preview and use the new cursor tokens.",
          expected_snapshot_hash: snapshot_hash,
          received_snapshot_hash: cursorSnapshotHash,
        },
        { status: 409 },
      );
    }

    // Guardrail: pdf_sandbox never allows touching production last_verified.
    if (mapping_preset_engine === "pdf_sandbox" && update_last_verified) {
      return Response.json(
        {
          ok: false,
          error: "PDF_SANDBOX_DISALLOWS_VERIFICATION_TOUCH",
          message:
            "update_last_verified is not supported in pdf_sandbox (it would touch production rows).",
          state,
        },
        { status: 409 },
      );
    }

    const { savedConfig, savedSourceKey } = await loadSavedConfig(state);

    const requestedSourceKey = String(
      body?.source_key || savedSourceKey || "",
    ).trim();

    const validationResult = await runValidations({
      state,
      snapshot_hash,
      parser_version_raw,
      mapping_preset: mapping_preset_ui,
      override_conflicts,
      override_batch,
      dry_run,
      confirm,
      required_confirm,
      override_conflicts_confirm,
      required_override_conflicts,
      session,
      requestedSourceKey,
    });

    if (validationResult.error) {
      return validationResult.response;
    }

    const { sourceKeyValidation } = validationResult;
    const sourceMeta = sourceKeyValidation.sourceMeta;
    const impl = sourceKeyValidation.impl;
    const parser_version = sourceKeyValidation.normalizedParserVersion;
    const warnings = Array.isArray(sourceKeyValidation.warnings)
      ? sourceKeyValidation.warnings
      : [];

    const defaultApplyMax = Number(impl?.limits?.max_apply_default ?? 25);
    const overrideApplyMax = Number(impl?.limits?.max_apply_override ?? 250);

    const parseLimit = Math.max(
      1,
      Math.min(
        override_batch ? overrideApplyMax : defaultApplyMax,
        requestedLimit,
      ),
    );

    const cfgResult = await buildCfgForApply({
      state,
      savedConfig,
      sourceMeta,
      parser_version,
      mapping_preset: mapping_preset_engine,
    });

    const cfg = cfgResult?.cfg;
    const applyWarnings = [
      ...(Array.isArray(sourceKeyValidation?.warnings)
        ? sourceKeyValidation.warnings
        : []),
      ...(Array.isArray(cfgResult?.warnings) ? cfgResult.warnings : []),
    ];

    // STEP 6D debug bundle
    const debugInfo = {
      parser_version_used:
        cfgResult?.parserSpec?.version_key_used || parser_version,
      adapter_used: String(cfg?.adapter || "").trim() || null,
      capabilities: cfgResult?.parserSpec?.capabilities || null,
      source_class: sourceMeta?.source_class || null,
<<<<<<< ours
      warnings: applyWarnings,
=======
      warnings,
>>>>>>> theirs
    };

    const snapshot = await fetchSnapshot({ state, cfg, snapshot_hash });

    const snapshotValidationResult = await runSnapshotValidation({
      snapshot,
      snapshot_hash,
      session,
      state,
      parser_version_raw,
      mapping_preset: mapping_preset_ui,
      override_conflicts,
      override_batch,
      dry_run,
    });

    if (snapshotValidationResult.error) {
      return snapshotValidationResult.response;
    }

    const { parsedRules, links } = await parseRules({
      state,
      snapshot,
      cfg,
      mapping_preset: mapping_preset_engine,
      cursor,
      limit: parseLimit,
    });

    const cursorData = computeCursorBookkeeping({
      snapshot,
      links,
      offset,
      parseLimit,
    });

    const { totalLinks, cursor_prev, nextOffset, done, cursor_out } =
      cursorData;

    const parsedRulesValidationResult = await runParsedRulesValidation({
      parsedRules,
      state,
      session,
      snapshot_hash,
      parser_version_raw,
      mapping_preset: mapping_preset_ui,
      override_conflicts,
      override_batch,
      dry_run,
    });

    if (parsedRulesValidationResult.error) {
      return parsedRulesValidationResult.response;
    }

    const ruleNumbers = parsedRules.map((r) => String(r.rule_number));

    const existingByRuleNumber = await loadExistingRulesByCanonical({
      state,
      ruleNumbers,
      courtType: cfg.court_type,
      ruleSet: cfg.rule_set,
    });

    const diff = computeDiff({ parsedRules, existingByRuleNumber });

    const latency_ms = Date.now() - startedAt;

    if (update_last_verified) {
      return await handleVerificationOnlyApply({
        session,
        state,
        snapshot_hash,
        parser_version_raw,
        mapping_preset: mapping_preset_engine,
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

        // STEP 6D
        debugInfo,
      });
    }

    const diffProcessed = processDiffForApplyMode({
      diff,
      apply_mode,
      override_conflicts,
      mapping_preset: mapping_preset_engine,
      parsedRules,
    });

    const {
      willUpdate,
      willInsert,
      willReplace,
      hardConflicts,
      bootstrapConflicts,
      isInsertOnly,
      isSandboxStaging,
    } = diffProcessed;

    // Sandbox mode does not participate in conflicts.
    if (!isSandboxStaging) {
      const conflictValidationResult = await runConflictValidations({
        hardConflicts,
        bootstrapConflicts,
        isInsertOnly,
        override_conflicts,
        required_override_conflicts,
        override_conflicts_confirm,
        diff,
        session,
        state,
        snapshot_hash,
        parser_version_raw,
        mapping_preset: mapping_preset_ui,
        override_batch,
        dry_run,
      });

      if (conflictValidationResult.error) {
        return conflictValidationResult.response;
      }
    }

    const cappedData = capBatchSizes({
      willInsert,
      willUpdate,
      override_batch,
      impl,
    });

    const {
      willInsertCapped,
      willUpdateCapped,
      requested,
      remaining,
      updateLimit,
      insertLimit,
    } = cappedData;

    // Sandbox mode does not require override_batch confirmations.
    if (!isSandboxStaging) {
      const batchLimitValidationResult = await runBatchLimitValidation({
        override_batch,
        willUpdate,
        willInsert,
        updateLimit,
        insertLimit,
        required_override_batch,
        session,
        state,
        snapshot_hash,
        parser_version_raw,
        mapping_preset: mapping_preset_ui,
        override_conflicts,
        dry_run,
      });

      if (batchLimitValidationResult.error) {
        return batchLimitValidationResult.response;
      }
    }

    if (dry_run === true) {
      return await handleDryRun({
        session,
        state,
        snapshot_hash,
        parser_version_raw,
        mapping_preset: mapping_preset_engine,
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

        // STEP 6D
        debugInfo,
      });
    }

    return await handleLiveApply({
      session,
      state,
      snapshot_hash,
      parser_version_raw,
      mapping_preset: mapping_preset_engine,
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

      // STEP 6D
      debugInfo,
    });
  } catch (error) {
    return handleApplyError(error);
  }
}
