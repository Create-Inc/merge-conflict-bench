import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const read = (rel) =>
  readFileSync(join(__dirname, "resolved", rel), "utf-8");

const applyRoute = read(
  "apps/web/src/app/api/admin/state-parser/apply/route.js",
);
const verificationHandler = read(
  "apps/web/src/app/api/admin/state-parser/apply/verificationHandler.js",
);
const dryRunHandler = read(
  "apps/web/src/app/api/admin/state-parser/apply/dryRunHandler.js",
);
const config = read(
  "apps/web/src/app/api/admin/state-parser/apply/config.js",
);
const liveApplyHandler = read(
  "apps/web/src/app/api/admin/state-parser/apply/liveApplyHandler.js",
);
const resolveParserSpec = read(
  "apps/web/src/app/api/admin/state-parser/shared/resolveParserSpec.js",
);
const previewRoute = read(
  "apps/web/src/app/api/admin/state-parser/preview/route.js",
);
const responseBuilder = read(
  "apps/web/src/app/api/admin/state-parser/preview/responseBuilder.js",
);

// =====================================================================
// BASE BEHAVIORS (shared by both branches)
// =====================================================================
describe("base behaviors", () => {
  describe("apply/route.js structure", () => {
    it("exports dynamic = force-dynamic", () => {
      expect(applyRoute).toMatch(/export\s+const\s+dynamic\s*=\s*"force-dynamic"/);
    });

    it("exports async POST handler", () => {
      expect(applyRoute).toMatch(/export\s+async\s+function\s+POST/);
    });

    it("requires admin session", () => {
      expect(applyRoute).toMatch(/requireAdminSessionOrReturnResponse/);
    });

    it("parses the apply request body", () => {
      expect(applyRoute).toMatch(/parseApplyRequest/);
    });

    it("validates cursor snapshot hash mismatch with 409", () => {
      expect(applyRoute).toMatch(/CURSOR_SNAPSHOT_MISMATCH/);
    });

    it("loads saved config for state", () => {
      expect(applyRoute).toMatch(/loadSavedConfig/);
    });

    it("runs validations pipeline", () => {
      expect(applyRoute).toMatch(/runValidations/);
    });

    it("fetches snapshot", () => {
      expect(applyRoute).toMatch(/fetchSnapshot/);
    });

    it("parses rules", () => {
      expect(applyRoute).toMatch(/parseRules/);
    });

    it("computes diff", () => {
      expect(applyRoute).toMatch(/computeDiff/);
    });

    it("handles verification-only apply path", () => {
      expect(applyRoute).toMatch(/handleVerificationOnlyApply/);
      expect(applyRoute).toMatch(/update_last_verified/);
    });

    it("handles dry run path", () => {
      expect(applyRoute).toMatch(/handleDryRun/);
    });

    it("handles live apply path", () => {
      expect(applyRoute).toMatch(/handleLiveApply/);
    });

    it("handles errors with handleApplyError", () => {
      expect(applyRoute).toMatch(/handleApplyError/);
    });
  });

  describe("apply/config.js", () => {
    it("exports loadSavedConfig function", () => {
      expect(config).toMatch(/export\s+async\s+function\s+loadSavedConfig/);
    });

    it("exports mergeConfig function", () => {
      expect(config).toMatch(/export\s+function\s+mergeConfig/);
    });

    it("exports validateSourceKey function", () => {
      expect(config).toMatch(/export\s+async\s+function\s+validateSourceKey/);
    });

    it("exports buildCfgForApply function", () => {
      expect(config).toMatch(/export\s+async\s+function\s+buildCfgForApply/);
    });

    it("normalizes court type via normalizeCourtLevelSafe", () => {
      expect(config).toMatch(/normalizeCourtLevelSafe/);
    });

    it("supports multi-source configs", () => {
      expect(config).toMatch(/multi_source_configs/);
    });
  });

  describe("verificationHandler.js", () => {
    it("exports handleVerificationOnlyApply function", () => {
      expect(verificationHandler).toMatch(
        /export\s+async\s+function\s+handleVerificationOnlyApply/,
      );
    });

    it("only allows library_only mapping preset", () => {
      expect(verificationHandler).toMatch(/library_only/);
      expect(verificationHandler).toMatch(
        /REFRESH_VERIFICATION_INVALID_PRESET/,
      );
    });

    it("requires empty diff for verification refresh", () => {
      expect(verificationHandler).toMatch(
        /REFRESH_VERIFICATION_REQUIRES_EMPTY_DIFF/,
      );
    });

    it("touches verified dates by IDs", () => {
      expect(verificationHandler).toMatch(/touchVerifiedDatesByIds/);
    });

    it("records audit events", () => {
      expect(verificationHandler).toMatch(/writeAuditEvent/);
      expect(verificationHandler).toMatch(/writeParserEvent/);
    });

    it("includes cursor data in response", () => {
      expect(verificationHandler).toMatch(/cursor_in/);
      expect(verificationHandler).toMatch(/cursor_out/);
      expect(verificationHandler).toMatch(/cursor_prev/);
    });
  });

  describe("dryRunHandler.js", () => {
    it("exports handleDryRun function", () => {
      expect(dryRunHandler).toMatch(
        /export\s+async\s+function\s+handleDryRun/,
      );
    });

    it("records apply event", () => {
      expect(dryRunHandler).toMatch(/recordApplyEvent/);
    });

    it("includes diff summary in response", () => {
      expect(dryRunHandler).toMatch(/will_insert/);
      expect(dryRunHandler).toMatch(/will_update/);
      expect(dryRunHandler).toMatch(/will_skip/);
    });

    it("handles sandbox staging mode", () => {
      expect(dryRunHandler).toMatch(/isSandboxStaging/);
      expect(dryRunHandler).toMatch(/pdf_sandbox/);
    });
  });

  describe("liveApplyHandler.js", () => {
    it("exports handleLiveApply function", () => {
      expect(liveApplyHandler).toMatch(
        /export\s+async\s+function\s+handleLiveApply/,
      );
    });

    it("handles sandbox staging mode by writing to staging only", () => {
      expect(liveApplyHandler).toMatch(/isSandboxStaging/);
      expect(liveApplyHandler).toMatch(/staging_batch_id/);
    });

    it("ensures rule source", () => {
      expect(liveApplyHandler).toMatch(/ensureRuleSource/);
    });

    it("applies database changes", () => {
      expect(liveApplyHandler).toMatch(/applyDatabaseChanges/);
    });

    it("deactivates bootstrap shadowed rules", () => {
      expect(liveApplyHandler).toMatch(/deactivateBootstrapShadowedRules/);
    });

    it("computes coverage counts after apply", () => {
      expect(liveApplyHandler).toMatch(/coverageCounts/);
    });

    it("records audit and parser events", () => {
      expect(liveApplyHandler).toMatch(/writeAuditEvent/);
      expect(liveApplyHandler).toMatch(/writeParserEvent/);
    });
  });

  describe("shared/resolveParserSpec.js", () => {
    it("exports resolveParserSpec function", () => {
      expect(resolveParserSpec).toMatch(
        /export\s+async\s+function\s+resolveParserSpec/,
      );
    });

    it("requires parser_version", () => {
      expect(resolveParserSpec).toMatch(/PARSER_VERSION_REQUIRED/);
    });

    it("normalizes parser version key", () => {
      expect(resolveParserSpec).toMatch(/normalizeParserVersionKeyStrict/);
    });

    it("checks state/source_class gates", () => {
      expect(resolveParserSpec).toMatch(/source_class/);
      expect(resolveParserSpec).toMatch(/supported_source_classes/);
    });

    it("warns on adapter hint mismatch (never blocks)", () => {
      expect(resolveParserSpec).toMatch(/SOURCE_ADAPTER_HINT_MISMATCH/);
    });
  });

  describe("preview/route.js structure", () => {
    it("exports dynamic = force-dynamic", () => {
      expect(previewRoute).toMatch(
        /export\s+const\s+dynamic\s*=\s*"force-dynamic"/,
      );
    });

    it("exports async POST handler", () => {
      expect(previewRoute).toMatch(/export\s+async\s+function\s+POST/);
    });

    it("requires admin session", () => {
      expect(previewRoute).toMatch(/requireAdminSessionOrReturnResponse/);
    });

    it("has time budget with MAX_MS and RESERVE_MS", () => {
      expect(previewRoute).toMatch(/MAX_MS/);
      expect(previewRoute).toMatch(/RESERVE_MS/);
    });

    it("validates state code", () => {
      expect(previewRoute).toMatch(/validateStateCode/);
    });

    it("validates source key", () => {
      expect(previewRoute).toMatch(/validateSourceKey/);
    });

    it("routes to correct adapter based on adapterName", () => {
      expect(previewRoute).toMatch(/PdfTextRuleAdapter/);
      expect(previewRoute).toMatch(/HybridIndexPdfAdapter/);
      expect(previewRoute).toMatch(/PatternP4MultiIndexAdapter/);
      expect(previewRoute).toMatch(/PatternHtmlIndexHtmlRuleAdapter/);
      expect(previewRoute).toMatch(/HtmlSingleIndexAdapter/);
    });

    it("saves config and rule source", () => {
      expect(previewRoute).toMatch(/saveConfig/);
      expect(previewRoute).toMatch(/saveRuleSource/);
    });

    it("builds success response", () => {
      expect(previewRoute).toMatch(/buildSuccessResponse/);
    });
  });

  describe("preview/responseBuilder.js", () => {
    it("exports buildSuccessResponse function", () => {
      expect(responseBuilder).toMatch(
        /export\s+async\s+function\s+buildSuccessResponse/,
      );
    });

    it("includes diff summary in response", () => {
      expect(responseBuilder).toMatch(/will_insert/);
      expect(responseBuilder).toMatch(/will_update|will_replace/);
      expect(responseBuilder).toMatch(/will_skip/);
    });

    it("includes snapshot data in response", () => {
      expect(responseBuilder).toMatch(/snapshot_hash/);
      expect(responseBuilder).toMatch(/snapshot_url/);
    });

    it("includes cursor data in response", () => {
      expect(responseBuilder).toMatch(/cursor_in/);
      expect(responseBuilder).toMatch(/cursor_out/);
    });

    it("writes audit and parser events", () => {
      expect(responseBuilder).toMatch(/writeAuditEvent/);
      expect(responseBuilder).toMatch(/writeParserEvent/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (version registry dispatch, resolveParserSpec shared, adapter override warnings)
// =====================================================================
describe("ours behaviors", () => {
  describe("resolveParserSpec is version-driven dispatch", () => {
    it("resolveParserSpec calls resolveParserVersionSpec", () => {
      expect(resolveParserSpec).toMatch(/resolveParserVersionSpec/);
    });

    it("resolveParserSpec checks for implemented flag", () => {
      expect(resolveParserSpec).toMatch(/PARSER_VERSION_NOT_IMPLEMENTED/);
      expect(resolveParserSpec).toMatch(/resolved\.implemented\s*!==\s*true/);
    });
  });

  describe("apply config builds impl from spec for limits logic", () => {
    it("validateSourceKey builds impl-like object from spec", () => {
      expect(config).toMatch(/version_key.*spec/s);
      expect(config).toMatch(/capabilities.*spec/s);
      expect(config).toMatch(/limits.*spec/s);
    });

    it("validateSourceKey returns parserSpec and adapterKey", () => {
      expect(config).toMatch(/parserSpec/);
      expect(config).toMatch(/adapterKey/);
    });
  });

  describe("buildCfgForApply warns on adapter drift (never blocks)", () => {
    it("warns on CONFIG_ADAPTER_OVERRIDE_IGNORED when config adapter differs from version adapter", () => {
      expect(config).toMatch(/CONFIG_ADAPTER_OVERRIDE_IGNORED/);
    });

    it("overrides cfg.adapter to version adapter", () => {
      expect(config).toMatch(/cfg\.adapter\s*=\s*adapterExpected/);
    });
  });

  describe("preview route resolves parser spec and warns on drift", () => {
    it("calls resolveParserSpec in preview", () => {
      expect(previewRoute).toMatch(/resolveParserSpec/);
    });

    it("preview warns on CONFIG_ADAPTER_OVERRIDE_IGNORED", () => {
      expect(previewRoute).toMatch(/CONFIG_ADAPTER_OVERRIDE_IGNORED/);
    });

    it("preview overrides cfg adapter to adapterExpected", () => {
      expect(previewRoute).toMatch(/adapter:\s*adapterExpected/);
    });
  });

  describe("apply route passes debugInfo to handlers", () => {
    it("constructs debugInfo with parser_version_used, adapter_used, capabilities, source_class", () => {
      expect(applyRoute).toMatch(/debugInfo/);
      expect(applyRoute).toMatch(/parser_version_used/);
      expect(applyRoute).toMatch(/adapter_used/);
      expect(applyRoute).toMatch(/capabilities/);
      expect(applyRoute).toMatch(/source_class/);
    });

    it("passes debugInfo to handleVerificationOnlyApply", () => {
      expect(applyRoute).toMatch(/debugInfo,/);
    });

    it("passes debugInfo to handleDryRun", () => {
      expect(applyRoute).toMatch(/debugInfo/);
    });

    it("passes debugInfo to handleLiveApply", () => {
      expect(applyRoute).toMatch(/debugInfo/);
    });
  });

  describe("handlers include STEP 6D debug fields in responses", () => {
    it("dryRunHandler includes parser_version_used, adapter_used, capabilities, source_class", () => {
      expect(dryRunHandler).toMatch(/parser_version_used/);
      expect(dryRunHandler).toMatch(/adapter_used/);
      expect(dryRunHandler).toMatch(/capabilities/);
      expect(dryRunHandler).toMatch(/source_class/);
    });

    it("liveApplyHandler includes debug fields in response", () => {
      expect(liveApplyHandler).toMatch(/parser_version_used/);
      expect(liveApplyHandler).toMatch(/adapter_used/);
    });

    it("verificationHandler includes debug fields in response", () => {
      expect(verificationHandler).toMatch(/parser_version_used/);
      expect(verificationHandler).toMatch(/adapter_used/);
    });

    it("responseBuilder includes debug fields in preview response", () => {
      expect(responseBuilder).toMatch(/parser_version_used/);
      expect(responseBuilder).toMatch(/adapter_used/);
      expect(responseBuilder).toMatch(/capabilities/);
      expect(responseBuilder).toMatch(/source_class/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (latency tracking, warnings array, snapshot content_type, preset normalization, pdf_sandbox guardrails)
// =====================================================================
describe("theirs behaviors", () => {
  describe("all handlers include latency_ms timing metric", () => {
    it("dryRunHandler includes latency_ms", () => {
      expect(dryRunHandler).toMatch(/latency_ms/);
    });

    it("liveApplyHandler includes latency_ms", () => {
      expect(liveApplyHandler).toMatch(/latency_ms/);
    });

    it("verificationHandler includes latency_ms", () => {
      expect(verificationHandler).toMatch(/latency_ms/);
    });

    it("responseBuilder includes latency_ms", () => {
      expect(responseBuilder).toMatch(/latency_ms/);
    });

    it("apply route computes latency_ms from startedAt", () => {
      expect(applyRoute).toMatch(/Date\.now\(\)\s*-\s*startedAt/);
    });
  });

  describe("all handlers include warnings array", () => {
    it("dryRunHandler includes warnings array from debugInfo", () => {
      expect(dryRunHandler).toMatch(
        /warnings.*Array\.isArray\(debugInfo\?\.warnings\)/s,
      );
    });

    it("liveApplyHandler includes warnings array", () => {
      expect(liveApplyHandler).toMatch(
        /warnings.*Array\.isArray\(debugInfo\?\.warnings\)/s,
      );
    });

    it("verificationHandler includes warnings array", () => {
      expect(verificationHandler).toMatch(
        /warnings.*Array\.isArray\(debugInfo\?\.warnings\)/s,
      );
    });

    it("responseBuilder includes warnings array", () => {
      expect(responseBuilder).toMatch(
        /warnings.*Array\.isArray\(warnings\)/s,
      );
    });
  });

  describe("snapshot content_type is included in responses", () => {
    it("dryRunHandler includes content_type in snapshot object", () => {
      expect(dryRunHandler).toMatch(/content_type.*snapshot/s);
    });

    it("liveApplyHandler includes content_type in snapshot object", () => {
      expect(liveApplyHandler).toMatch(/content_type.*snapshot/s);
    });

    it("responseBuilder determines content type from source_class", () => {
      expect(responseBuilder).toMatch(/getSnapshotContentType/);
      expect(responseBuilder).toMatch(/application\/pdf/);
    });
  });

  describe("apply route normalizes mapping_preset with normalizeMappingPresetForEngine", () => {
    it("imports normalizeMappingPresetForEngine", () => {
      expect(applyRoute).toMatch(/normalizeMappingPresetForEngine/);
    });

    it("differentiates mapping_preset_ui from mapping_preset_engine", () => {
      expect(applyRoute).toMatch(/mapping_preset_ui/);
      expect(applyRoute).toMatch(/mapping_preset_engine/);
    });
  });

  describe("preview route normalizes mapping_preset with normalizeMappingPresetForEngine", () => {
    it("imports normalizeMappingPresetForEngine", () => {
      expect(previewRoute).toMatch(/normalizeMappingPresetForEngine/);
    });

    it("differentiates mapping_preset_ui from mapping_preset_engine", () => {
      expect(previewRoute).toMatch(/mapping_preset_ui/);
      expect(previewRoute).toMatch(/mapping_preset_engine/);
    });
  });

  describe("apply route blocks pdf_sandbox from touching production last_verified", () => {
    it("has PDF_SANDBOX_DISALLOWS_VERIFICATION_TOUCH guardrail", () => {
      expect(applyRoute).toMatch(
        /PDF_SANDBOX_DISALLOWS_VERIFICATION_TOUCH/,
      );
    });

    it("returns 409 when pdf_sandbox + update_last_verified", () => {
      expect(applyRoute).toMatch(
        /pdf_sandbox.*update_last_verified/s,
      );
    });
  });

  describe("preview route includes adapter-specific counters", () => {
    it("responseBuilder includes index_candidates_total and index_candidates_selected", () => {
      expect(responseBuilder).toMatch(/index_candidates_total/);
      expect(responseBuilder).toMatch(/index_candidates_selected/);
    });

    it("responseBuilder includes pdf_units_total and pdf_units_scanned", () => {
      expect(responseBuilder).toMatch(/pdf_units_total/);
      expect(responseBuilder).toMatch(/pdf_units_scanned/);
    });

    it("responseBuilder includes rules_parsed counter", () => {
      expect(responseBuilder).toMatch(/rules_parsed/);
    });
  });
});
