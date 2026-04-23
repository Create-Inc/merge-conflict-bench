# MergeConflictBench

An evaluation suite for measuring the ability of LLM agents to resolve merge conflicts correctly.

## Overview

MergeConflictBench consists of 86 real merge conflicts extracted from production, each with the conflicted merge result containing conflict markers. An agent's task is to resolve the conflicts; its output is scored by executing 2,533 hidden holdout tests that verify behavior from both branches was preserved.

The benchmark is grounded in the same principle as [RefactorBench](../refactor-bench): *behavioral preservation is a functional property, and functional properties are best verified by functional tests.*

A correct merge must preserve three categories of behavior:
1. **Base behaviors** — functionality that existed before either branch diverged
2. **Ours behaviors** — functionality introduced by the current branch
3. **Theirs behaviors** — functionality introduced by the incoming branch

The hidden test suite for each case covers all three categories. A resolution passes only if it preserves everything.

## Corpus

86 cases, 2,533 tests across three tiers.

### Complex (20+ conflict blocks)

| Case | Files | Blocks | Tests | Domain |
|------|-------|--------|-------|--------|
| `fleet_parts_transfers` | 4 | 46 | 44 | Fleet parts transfer with receipts and dispatch |
| `state_parser_apply` | 1 | 45 | 40 | Regulatory data import API with dry-run/live modes |
| `account_statements` | 2 | 36 | 35 | Mobile account statements and detail views |
| `fleet_parts_receipts` | 3 | 34 | 34 | Fleet parts receipt posting and transfer receiving |
| `stats_home_page` | 2 | 33 | 29 | Homepage with stats API and dashboard metrics |
| `mobile_auth_flow` | 4 | 32 | 55 | Mobile authentication via WebView token exchange |
| `dispatch_sidebar_nav` | 2 | 31 | 28 | Dispatch sidebar and dashboard navigation layout |
| `account_auth_pages` | 4 | 30 | 63 | Signup, signin, forgot/reset password pages |
| `state_parser_preview` | 8 | 25 | 94 | Admin state-parser preview/apply with version registry |
| `campaign_mapping_tool` | 7 | 25 | 63 | Campaign canvas with toolbar and form components |
| `listing_watchlist` | 3 | 25 | 22 | Listing detail with watchlist API and mobile views |
| `celebration_overlay` | 1 | 24 | 73 | Confetti animation with audio chime synthesis |
| `mobile_chat_profile` | 5 | 22 | 20 | Mobile chat, profile, and help support sections |
| `bulk_product_status` | 3 | 22 | 32 | Admin bulk product status change with preview |
| `legal_compliance_settings` | 2 | 22 | 32 | EULA/SMS document URL management |
| `mobile_task_detail` | 5 | 21 | 62 | Task detail modal with comments and attachments |
| `route_mileage_planning` | 3 | 21 | 34 | Mileage estimation and splash drive planning hooks |
| `navigation_layout_tailwind` | 3 | 20 | 31 | Navigation component with Tailwind config and layout |

### Moderate (8–19 conflict blocks)

| Case | Files | Blocks | Tests | Domain |
|------|-------|--------|-------|--------|
| `resource_crud_modals` | 7 | 19 | 29 | Resource create/edit modals with API handlers |
| `checkout_payment_verify` | 3 | 19 | 28 | Checkout session creation and payment verification |
| `trade_show_form` | 1 | 19 | 83 | Mobile trade show creation with date input and templates |
| `dealer_integration_csv` | 3 | 17 | 27 | Dealer integration CSV handlers and logout page |
| `content_guides_pages` | 6 | 16 | 24 | Content site with guides, local, and help pages |
| `crm_dashboard_modules` | 5 | 16 | 26 | CRM dashboard with tasks, deals, and customer detail |
| `onboarding_agreement` | 4 | 16 | 60 | Invitation flow with PDF/HTML agreement generation |
| `state_parser_sources` | 7 | 15 | 41 | State parser source discovery and registration UI |
| `telephony_voice_test` | 7 | 15 | 28 | Admin telephony and voice test pages with Twilio |
| `invoice_create_modal` | 4 | 15 | 46 | Invoice creation modal with mobile invoice views |
| `mobile_tab_navigation` | 4 | 14 | 41 | Bottom tab bar with badge counts and theme support |
| `expo_auth_token_v2` | 2 | 14 | 34 | Expo auth token exchange and web success callback |
| `notification_workflow` | 6 | 13 | 35 | Notification settings with workflow import and broadcast |
| `signin_signup_landing` | 3 | 13 | 29 | Landing page with signin and signup flows |
| `ai_studio_animation` | 2 | 13 | 40 | AI studio analyzing animation and styles |
| `org_switcher` | 3 | 12 | 58 | Organization switcher with deletion and RBAC |
| `dashboard_data_hooks` | 3 | 12 | 37 | Dashboard data API route and hooks for web/mobile |
| `legal_compliance_v2` | 2 | 12 | 25 | Document link storage (parallel variant) |
| `ai_studio_beta_tabs` | 5 | 11 | 31 | AI studio beta tabs with mobile and web views |
| `globe_renderer_animation` | 4 | 10 | 33 | Globe renderer with continent sparks and animation loop |
| `session_onboarding_user` | 3 | 10 | 23 | Session management, onboarding page, and user hook |
| `admin_api_usage_report` | 3 | 10 | 22 | Admin API usage report with mobile version display |
| `mobile_search_filters` | 5 | 9 | 12 | Mobile search filters for decade, genre, and year |
| `pricing_signout_cta` | 3 | 9 | 19 | Pricing page with signout route and floating demo CTA |
| `arena_seating_map` | 3 | 9 | 17 | Arena seating map with game preview page |
| `form_input_components` | 6 | 8 | 15 | Form input components: text, file, radio, checkbox, dropdown |
| `auth_api_routes` | 4 | 8 | 49 | Login, signup, OTP routes and error boundary |
| `assessment_engagement` | 3 | 8 | 20 | Assessment engagement survey setup and conversion |
| `club_invite_accept` | 3 | 8 | 16 | Club invite link generation and acceptance flow |

### Simple (2–7 conflict blocks)

| Case | Files | Blocks | Tests | Domain |
|------|-------|--------|-------|--------|
| `billing_pricing_pages` | 3 | 7 | 18 | Billing and pricing pages with homepage layout |
| `company_user_invite` | 3 | 7 | 17 | Company user invitation with create user modal |
| `password_reset_request` | 2 | 7 | 18 | Password reset request API and forgot password page |
| `group_chat_video` | 2 | 7 | 16 | Mobile group chat and video call views |
| `meta_oauth_connect` | 3 | 6 | 16 | Meta OAuth start/callback with connect section UI |
| `mobile_webview_auth` | 3 | 6 | 14 | Mobile WebView auth complete and callback pages |
| `client_dashboard_tabs` | 3 | 6 | 13 | Client dashboard with tab navigation and summary panel |
| `user_agreement_settings` | 3 | 6 | 12 | User agreement acceptance with public settings API |
| `report_filters_shows` | 3 | 6 | 10 | Report filters with accessible shows data source |
| `signin_academy_service` | 2 | 6 | 22 | Signin page and academy service landing page |
| `telegram_auto_trade` | 2 | 6 | 12 | Telegram webhook button handler with auto-trade logic |
| `athlete_contact_api` | 1 | 6 | 30 | Contact endpoint with email conflict detection |
| `password_reset_full` | 5 | 5 | 22 | Full password reset flow: request, confirm, and pages |
| `admin_manual_docs` | 5 | 5 | 20 | Admin manual documentation with page content and helpers |
| `brand_header_layout` | 5 | 5 | 17 | Brand utilities and header layout for web and mobile |
| `export_compliance_tests` | 5 | 5 | 16 | Compliance and export route tests with access control |
| `account_signup_email` | 3 | 5 | 19 | Account signup with email verification API routes |
| `mobile_metro_polyfill` | 3 | 5 | 17 | Metro bundler config with Reflect.construct polyfill |
| `explore_featured_places` | 3 | 5 | 15 | Explore featured places with itinerary perks handler |
| `mobile_customer_filters` | 4 | 4 | 51 | Customer search with territories and team queries |
| `presales_copilot_products` | 4 | 4 | 39 | Presales copilot product CRUD with merge and enrich |
| `password_reset_confirm` | 4 | 4 | 33 | Password reset confirm/request API with form pages |
| `password_reset_flow` | 4 | 4 | 26 | Password reset flow with request and confirm routes |
| `mobile_auth_signup` | 3 | 4 | 33 | Mobile auth signup and signin with token exchange |
| `tradeshow_header_tabs` | 3 | 4 | 23 | Trade show header tabs with pricing page |
| `mfa_email_send` | 2 | 4 | 9 | MFA email request with send-email utility |
| `expo_auth_token` | 2 | 4 | 21 | Expo auth token route and web success callback |
| `app_head_layout` | 2 | 4 | 19 | App root layout and head metadata configuration |
| `job_detail_application` | 2 | 4 | 18 | Job detail with generated application and status |
| `campaign_call_panel` | 1 | 4 | 31 | Call panel with speaker tracking and viewer counts |
| `sme_leader_domains` | 3 | 3 | 18 | SME leader API with domain and assignment routes |
| `recurring_plan_modal` | 3 | 3 | 17 | Recurring plan modal with customer plan hook |
| `auth_session_pages_v2` | 3 | 3 | 17 | Auth session pages: signup, signin, logout (v2) |
| `auth_session_pages` | 3 | 3 | 15 | Auth session pages: signup, signin, logout |
| `product_views_popular` | 3 | 3 | 14 | Product views tracking and popular products API |
| `league_chop_history` | 2 | 3 | 14 | League chop history API and chop tab UI |
| `mobile_explore_search` | 2 | 2 | 14 | Mobile explore search results and filter bar |
| `matchmaking_user_helpers` | 2 | 2 | 12 | Matchmaking user helpers and users API route |
| `product_import_modal` | 1 | 2 | 46 | Field mapping utility for product variants and IDs |

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

The 86 cases and 2,533 tests are extracted from production merge conflict tracking:
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
