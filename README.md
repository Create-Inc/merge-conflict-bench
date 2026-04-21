# MergeConflictBench

An evaluation suite for measuring the ability of LLM agents to resolve merge conflicts correctly.

## Overview

MergeConflictBench consists of real merge conflicts extracted from production, each with the conflicted merge result containing conflict markers. An agent's task is to resolve the conflicts; its output is scored by executing hidden holdout tests that verify behavior from both branches was preserved.

The benchmark is grounded in the same principle as [RefactorBench](../refactor-bench): *behavioral preservation is a functional property, and functional properties are best verified by functional tests.*

A correct merge must preserve three categories of behavior:
1. **Base behaviors** — functionality that existed before either branch diverged
2. **Ours behaviors** — functionality introduced by the current branch
3. **Theirs behaviors** — functionality introduced by the incoming branch

The hidden test suite for each case covers all three categories. A resolution passes only if it preserves everything.

## Corpus

### Complex (20+ conflict blocks)

| Case | Files | Blocks | Domain | Key conflict types |
|------|-------|--------|--------|-------------------|
| `state_parser_apply` | 1 | 45 | Regulatory data import API with dry-run/live modes | Function refactoring, parameter normalization, handler restructuring |
| `mobile_auth_flow` | 4 | 32 | Mobile authentication via WebView token exchange | Auth architecture changes, retry/timeout logic, postMessage handling |
| `account_auth_pages` | 4 | 30 | Signup, signin, forgot/reset password pages | UI layout changes, import refactoring, form validation |
| `campaign_mapping_tool` | 7 | 25 | Campaign canvas with toolbar and form components | State management, styling, tool panel modifications |
| `state_parser_preview` | 8 | 25 | Admin state-parser preview/apply with version registry | Function extraction, config building, async/await changes |
| `celebration_overlay` | 1 | 24 | Confetti animation with audio chime synthesis | Audio oscillator routing, animation timing, particle system |
| `bulk_product_status` | 3 | 22 | Admin bulk product status change with preview | API response formatting, success messages, history table UI |
| `legal_compliance_settings` | 2 | 22 | EULA/SMS document URL management | State management refactoring, API payload structure, variable naming |
| `mobile_task_detail` | 5 | 21 | Task detail modal with comments and attachments | Component naming, date formatting, avatar/UI modifications |
| `route_mileage_planning` | 3 | 21 | Mileage estimation and splash drive planning hooks | Variable renaming, status enum changes, calculation logic |

### Moderate (8–19 conflict blocks)

| Case | Files | Blocks | Domain | Key conflict types |
|------|-------|--------|--------|-------------------|
| `trade_show_form` | 1 | 19 | Mobile trade show creation with date input and templates | Import changes, helper removal, date formatting, utility extraction |
| `onboarding_agreement` | 4 | 16 | Invitation flow with PDF/HTML agreement generation | State building, parameter passing, iframe vs direct rendering |
| `mobile_tab_navigation` | 4 | 14 | Bottom tab bar with badge counts and theme support | Icon/theme provider refactoring, color variables, animation naming |
| `org_switcher` | 3 | 12 | Organization switcher with deletion and RBAC | ID type handling, validation simplification, storage/URL sync |
| `legal_compliance_v2` | 2 | 12 | Document link storage (parallel variant) | State variable naming, data structure, mutation naming |

### Simple (2–7 conflict blocks)

| Case | Files | Blocks | Domain | Key conflict types |
|------|-------|--------|--------|-------------------|
| `auth_api_routes` | 4 | 8 | Login, signup, OTP routes and error boundary | Import additions, logging, error handling |
| `athlete_contact_api` | 1 | 6 | Contact endpoint with email conflict detection | Email uniqueness rules, contact type checking, error responses |
| `mobile_customer_filters` | 4 | 4 | Customer search with territories and team queries | Hook refactoring, query keys, debounce timing |
| `campaign_call_panel` | 1 | 4 | Call panel with speaker tracking and viewer counts | Variable naming, display normalization, presence matching |
| `product_import_modal` | 1 | 2 | Field mapping utility for product variants and IDs | Field mapping rules, column matching, schema additions |

## Layout

```text
merge-conflict-bench/
  README.md
  schemas.ts                        # TypeScript type definitions
  data/
    <case_name>/
      eval.config.json              # case metadata (name, language, counts)
      conflict_eval.config.json     # conflict blocks, test path, preserved behaviors
      conflicted/                   # files with <<<<<<< markers (agent input)
      resolved/                     # reference resolution (for test authoring)
      *.test.js                     # hidden test suite (holdout)
  scripts/
    extract.ts                     # pull cases from BigQuery
    evaluate.ts                    # run hidden tests against a resolution
```

## Scoring

MergeConflictBench produces five scores per resolution attempt:

| Score | Type | Description |
|-------|------|-------------|
| **Passes Tests** | Binary | Do the hidden holdout tests pass? *Primary metric.* |
| Agent Reported Success | Binary | Did the agent signal success via its termination tool? |
| No Conflict Markers | Binary | Output contains no remaining `<<<<<<<` markers |
| Compiles | Binary | Resolved files pass static analysis |
| Cost | $ | Total LLM cost in dollars |

## Preserved Behaviors

Each case's `conflict_eval.config.json` includes a `preservedBehaviors` list documenting what the hidden tests verify. Each entry has:
- `origin` — which branch (`base`, `ours`, or `theirs`) introduced the behavior
- `description` — human-readable description of the behavior

This serves as the "contract" of a correct merge. The hidden tests are the executable form of this contract.

Example:
```json
{
  "preservedBehaviors": [
    { "origin": "base", "description": "RBAC check rejects unauthorized users" },
    { "origin": "ours", "description": "Dry-run mode returns preview without persisting" },
    { "origin": "theirs", "description": "New travel_type field is normalized and stored" }
  ]
}
```

## Data Sources

Cases are extracted from production merge conflict tracking:
- **BigQuery**: `generation.fs_conflict_results` (3.3M rows) and `generation.merge_fs_conflict_resolution_results` (109K rows)
- Extraction selects for resolved conflicts with `custom_resolution` or `accepted_both` strategies — the non-trivial cases where the agent had to actually think about how to combine both sides

Hidden tests are authored per-case after extraction, covering the behaviors from each branch.

## Extraction

```bash
# Dry run — see what's available
doppler run --project flux-worker --config prd -- \
  npx tsx merge-conflict-bench/scripts/extract.ts --dry-run --limit 50

# Extract cases
doppler run --project flux-worker --config prd -- \
  npx tsx merge-conflict-bench/scripts/extract.ts --limit 50 --min-blocks 2
```
