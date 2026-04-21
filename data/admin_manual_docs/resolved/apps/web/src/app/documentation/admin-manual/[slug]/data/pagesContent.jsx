import {
  Activity,
  Bot,
  Building2,
  CreditCard,
  Gauge,
  Lock,
  Plug,
  ScrollText,
  Shield,
  Users,
} from "lucide-react";
import { InlineCode } from "../components/InlineCode";
import { BulletList } from "../components/BulletList";

export const ADMIN_MANUAL_PAGES = [
  {
    slug: "admin-overview",
    title: "Admin overview",
    summary:
      "What admins own: safety, reliability, access, integrations, and cost control.",
    icon: Building2,
    sections: [
      {
        id: "what-you-own",
        title: "What you own",
        icon: Building2,
        body: (
          <>
            <p>
              As an admin, you&apos;re responsible for keeping the workspace safe
              and predictable. Users can build fast, but admins make sure the
              system stays healthy.
            </p>
            <BulletList
              items={[
                "Access: who can sign in and what they can do",
                "Integrations: OAuth health, scopes, and ownership",
                "Reliability: failures, retries, and noisy workflows",
                "Cost control: plan gates, billing status, and runaway executions",
                "Risk control: AI guardrails and sensitive data handling",
              ]}
            />
          </>
        ),
      },
      {
        id: "admin-surfaces",
        title: "The key admin surfaces",
        icon: Gauge,
        body: (
          <>
            <p>These are the pages you&apos;ll use most when troubleshooting.</p>
            <BulletList
              items={[
                "/admin — overview dashboards",
                "/admin/users — user list, roles, status",
                "/admin/system — service health",
                "/admin/audit-logs — who changed what",
                "/admin/smoke-tests — quick integration checks",
                "/error-tracking — grouped failures",
              ]}
            />
          </>
        ),
      },
      {
        id: "weekly-checklist",
        title: "A simple weekly checklist",
        icon: ScrollText,
        body: (
          <>
            <BulletList
              items={[
                "Review error groups for repeats and rising counts",
                "Check for expired / revoked OAuth connections",
                "Scan audit logs for role changes and sensitive config edits",
                "Spot any performance regressions (slow nodes trending up)",
                "Confirm billing is healthy if you rely on plan gating",
              ]}
            />
          </>
        ),
      },
    ],
  },

  {
    slug: "roles-and-permissions",
    title: "Roles + permissions",
    summary:
      "How roles work, what to restrict, and how to keep admin access tight.",
    icon: Lock,
    sections: [
      {
        id: "least-privilege",
        title: "Least privilege (the rule)",
        icon: Lock,
        body: (
          <>
            <p>
              The safest workspace is the one where the smallest number of
              people can do the highest-impact things.
            </p>
            <BulletList
              items={[
                "Keep admin role assignments small and intentional",
                "Review admin access on a schedule (monthly is fine)",
                "Use shared service accounts for critical integrations (when possible)",
              ]}
            />
          </>
        ),
      },
      {
        id: "oauth-scopes",
        title: "OAuth scopes are also permissions",
        icon: Plug,
        body: (
          <>
            <p>
              Most real risk doesn&apos;t come from the UI — it comes from what a
              connected integration is allowed to do.
            </p>
            <BulletList
              items={[
                "Too few scopes → workflows fail",
                "Too many scopes → workflows can do unnecessary harm",
                "Prefer the minimum scopes that still allow the job",
              ]}
            />
          </>
        ),
      },
      {
        id: "accountability",
        title: "Accountability",
        icon: ScrollText,
        body: (
          <>
            <p>
              When something changes, you want a clear answer to: who did it and
              when.
            </p>
            <p>
              Use <InlineCode>/admin/audit-logs</InlineCode> to trace role
              changes, integration reconnects, and workflow edits.
            </p>
          </>
        ),
      },
    ],
  },

  {
    slug: "user-management",
    title: "User management",
    summary: "Invites, account status, and keeping the user list clean.",
    icon: Users,
    sections: [
      {
        id: "where-to-manage",
        title: "Where to manage users",
        icon: Users,
        body: (
          <>
            <p>
              Your primary control surface is <InlineCode>/admin/users</InlineCode>.
            </p>
            <BulletList
              items={[
                "Invite or approve new users",
                "Disable access for offboarding",
                "Review role assignments",
              ]}
            />
          </>
        ),
      },
      {
        id: "offboarding",
        title: "Offboarding (do this every time)",
        icon: Shield,
        body: (
          <>
            <p>
              Offboarding is where most security issues happen. Make it boring
              and repeatable.
            </p>
            <BulletList
              items={[
                "Disable the user account",
                "Remove admin role if present",
                "Reconnect critical integrations away from personal accounts",
                "Check recent audit logs for last changes",
              ]}
            />
          </>
        ),
      },
      {
        id: "access-denied",
        title: "Helping users who are blocked",
        icon: Lock,
        body: (
          <>
            <p>If users report being blocked, confirm:</p>
            <BulletList
              items={[
                "They are signing in with the correct email",
                "Their user status is active",
                "Their email domain is allowed (if domain restriction is enabled)",
              ]}
            />
            <p>
              Users will typically see <InlineCode>/access-denied</InlineCode>
              when they don&apos;t meet access requirements.
            </p>
          </>
        ),
      },
    ],
  },

  {
    slug: "sso-and-domain-restrictions",
    title: "SSO + domain restrictions",
    summary: "Limit access to your company domain and reduce workspace risk.",
    icon: Shield,
    sections: [
      {
        id: "why",
        title: "Why domain restrictions help",
        icon: Shield,
        body: (
          <>
            <p>
              Domain restriction is a simple guardrail: it prevents accidental
              access from personal emails and makes onboarding more consistent.
            </p>
          </>
        ),
      },
      {
        id: "where",
        title: "Where to manage",
        icon: Lock,
        body: (
          <>
            <p>
              Configure allowed domains at <InlineCode>/settings/sso-domains</InlineCode>.
            </p>
            <p>
              If a user can&apos;t sign in, verify their email domain matches an
              allowed entry.
            </p>
          </>
        ),
      },
      {
        id: "troubleshooting",
        title: "Troubleshooting",
        icon: Activity,
        body: (
          <>
            <BulletList
              items={[
                "User uses a personal email → ask them to sign in with company email",
                "Multiple Google accounts in browser → have them confirm active account",
                "Recently added domain not working → refresh and try again, then check logs",
              ]}
            />
          </>
        ),
      },
    ],
  },

  {
    slug: "integration-governance",
    title: "Integrations governance",
    summary:
      "Permission hygiene, connection ownership, and avoiding fragile workflows.",
    icon: Plug,
    sections: [
      {
        id: "ownership",
        title: "Connection ownership",
        icon: Plug,
        body: (
          <>
            <p>
              Workflows break when an integration is tied to a single person&apos;s
              account and that person leaves or revokes access.
            </p>
            <BulletList
              items={[
                "Use shared/service accounts for critical systems when possible",
                "Document which workflows depend on which connections",
                "Prefer one stable connection per workspace over many personal ones",
              ]}
            />
          </>
        ),
      },
      {
        id: "scope-hygiene",
        title: "Scope hygiene",
        icon: Lock,
        body: (
          <>
            <p>
              Scopes decide what the workflow can do. Treat them like API keys.
            </p>
            <BulletList
              items={[
                "Request only the scopes you need",
                "Re-connect when adding new capabilities",
                "Avoid admin-level scopes unless absolutely required",
              ]}
            />
          </>
        ),
      },
      {
        id: "where-to-check",
        title: "Where to check health",
        icon: Gauge,
        body: (
          <>
            <BulletList
              items={[
                "Integrations: /settings/integrations",
                "Smoke tests: /admin/smoke-tests",
                "Execution logs: /monitor/[id]",
              ]}
            />
          </>
        ),
      },
    ],
  },

  {
    slug: "oauth-troubleshooting",
    title: "OAuth troubleshooting",
    summary: "Expired tokens, missing scopes, and quick restores.",
    icon: Plug,
    sections: [
      {
        id: "symptoms",
        title: "Common symptoms",
        icon: Activity,
        body: (
          <>
            <BulletList
              items={[
                "401/403 errors in execution logs",
                "Provider says 'permission denied'",
                "It worked yesterday and stopped today",
              ]}
            />
          </>
        ),
      },
      {
        id: "fast-fix",
        title: "Fast fix checklist",
        icon: Plug,
        body: (
          <>
            <BulletList
              items={[
                "Reconnect the integration in /settings/integrations",
                "Confirm the correct scopes are granted",
                "Run a small test workflow that reads + writes a safe target",
              ]}
            />
          </>
        ),
      },
      {
        id: "prevent",
        title: "How to prevent repeats",
        icon: Shield,
        body: (
          <>
            <BulletList
              items={[
                "Standardize on fewer shared connections",
                "Avoid personal accounts for critical integrations",
                "Use smoke tests after reconnects",
              ]}
            />
          </>
        ),
      },
    ],
  },

  {
    slug: "system-health",
    title: "System health",
    summary: "What to check when users report failures or slowness.",
    icon: Activity,
    sections: [
      {
        id: "triage",
        title: "Triage questions",
        icon: ScrollText,
        body: (
          <>
            <BulletList
              items={[
                "Is it one workflow or many?",
                "Is it one integration provider or multiple?",
                "Did something change recently (audit logs)?",
                "Are failures new or long-running (error groups)?",
              ]}
            />
          </>
        ),
      },
      {
        id: "where-to-look",
        title: "Where to look",
        icon: Activity,
        body: (
          <>
            <BulletList
              items={[
                "Admin system: /admin/system",
                "Error tracking: /error-tracking",
                "Workflow monitoring: /monitor/[id]",
                "Smoke tests: /admin/smoke-tests",
              ]}
            />
          </>
        ),
      },
      {
        id: "common-causes",
        title: "Common causes",
        icon: Gauge,
        body: (
          <>
            <BulletList
              items={[
                "OAuth tokens expired or revoked",
                "Rate limiting from an external provider",
                "Prompt or schema change broke downstream actions",
                "Plan gates or billing status changed",
              ]}
            />
          </>
        ),
      },
    ],
  },

  {
    slug: "error-tracking",
    title: "Error tracking",
    summary: "Use error groups to find repeat issues and fix them once.",
    icon: Activity,
    sections: [
      {
        id: "why",
        title: "Why groups matter",
        icon: Activity,
        body: (
          <>
            <p>
              A single flaky workflow can create dozens of failures. Grouping
              helps you fix the root cause one time.
            </p>
          </>
        ),
      },
      {
        id: "triage",
        title: "A good triage flow",
        icon: Gauge,
        body: (
          <>
            <BulletList
              items={[
                "Pick the biggest error group (by count)",
                "Open a recent example execution",
                "Find the first failing step",
                "Fix the cause (scopes, prompt, rate limit)",
                "Re-run a small test",
              ]}
            />
          </>
        ),
      },
      {
        id: "where",
        title: "Where to use it",
        icon: ScrollText,
        body: (
          <>
            <p>
              Start at <InlineCode>/error-tracking</InlineCode>, then drill into
              specific executions.
            </p>
          </>
        ),
      },
    ],
  },

  {
    slug: "audit-logs",
    title: "Audit logs",
    summary: "Who changed what, and when.",
    icon: ScrollText,
    sections: [
      {
        id: "what-its-for",
        title: "What it&apos;s for",
        icon: ScrollText,
        body: (
          <>
            <BulletList
              items={[
                "Investigate suspicious activity",
                "Trace workflow edits and configuration changes",
                "Understand integration reconnects",
                "Explain why users suddenly hit gating",
              ]}
            />
          </>
        ),
      },
      {
        id: "where",
        title: "Where to view",
        icon: ScrollText,
        body: (
          <>
            <p>
              Audit logs live at <InlineCode>/admin/audit-logs</InlineCode>.
            </p>
          </>
        ),
      },
      {
        id: "support",
        title: "Using audit logs in support",
        icon: Users,
        body: (
          <>
            <p>
              When a user says "nothing changed," audit logs let you confirm.
              Pair them with error groups to connect changes to failures.
            </p>
          </>
        ),
      },
    ],
  },

  {
    slug: "billing-and-subscriptions",
    title: "Billing + subscriptions",
    summary: "How subscription status affects product access.",
    icon: CreditCard,
    sections: [
      {
        id: "where",
        title: "Where to manage",
        icon: CreditCard,
        body: (
          <>
            <p>
              Admin billing view: <InlineCode>/admin/billing</InlineCode>.
            </p>
          </>
        ),
      },
      {
        id: "what-changes",
        title: "What changes when billing changes",
        icon: Shield,
        body: (
          <>
            <BulletList
              items={[
                "Plan gates may block certain actions",
                "Users may see upgrade prompts",
                "Some workflow volume limits can change",
              ]}
            />
          </>
        ),
      },
      {
        id: "diagnose",
        title: "Diagnosing billing-related issues",
        icon: Gauge,
        body: (
          <>
            <BulletList
              items={[
                "Check Stripe status in the billing page",
                "Check audit logs for recent billing changes",
                "Confirm webhook sync health (if available)",
              ]}
            />
          </>
        ),
      },
    ],
  },

  {
    slug: "plan-gating",
    title: "Plan gating",
    summary:
      "Why limits exist, what users experience, and how to diagnose gating failures.",
    icon: Shield,
    sections: [
      {
        id: "why",
        title: "Why gates exist",
        icon: Shield,
        body: (
          <>
            <BulletList
              items={[
                "Control compute cost (especially AI)",
                "Prevent runaway workflows",
                "Align usage with value",
              ]}
            />
          </>
        ),
      },
      {
        id: "user-experience",
        title: "What users see",
        icon: Users,
        body: (
          <>
            <p>
              Users typically see an upgrade prompt or a clear error in the UI
              when they hit a gate.
            </p>
          </>
        ),
      },
      {
        id: "support",
        title: "Support playbook",
        icon: ScrollText,
        body: (
          <>
            <BulletList
              items={[
                "Confirm billing status and current plan",
                "Confirm what limit was hit (if shown)",
                "Check recent usage spikes (analytics)",
              ]}
            />
          </>
        ),
      },
    ],
  },

  {
    slug: "ai-governance",
    title: "AI governance",
    summary:
      "Guardrails for AI-powered actions: structured outputs, review, and risk control.",
    icon: Bot,
    sections: [
      {
        id: "risks",
        title: "The risks",
        icon: Bot,
        body: (
          <>
            <BulletList
              items={[
                "Hallucinations (confident but wrong)",
                "Invalid JSON / missing keys",
                "Drift when prompts change",
                "High-impact actions firing unexpectedly",
              ]}
            />
          </>
        ),
      },
      {
        id: "controls",
        title: "Recommended controls",
        icon: Shield,
        body: (
          <>
            <BulletList
              items={[
                "Require structured outputs for action steps",
                "Constrain labels to an allowed set",
                "Use test mode for prompt/schema edits",
                "Add human review for high-impact workflows",
              ]}
            />
          </>
        ),
      },
      {
        id: "review",
        title: "How to review a workflow with AI",
        icon: ScrollText,
        body: (
          <>
            <p>
              Ask: what can this workflow change in the real world? If it can
              delete data, message customers, or touch sensitive systems, make
              it require review.
            </p>
          </>
        ),
      },
    ],
  },

  {
    slug: "performance-and-reliability",
    title: "Performance + reliability",
    summary: "Spot slow nodes, rising failure rates, and systematic issues.",
    icon: Gauge,
    sections: [
      {
        id: "what-good-looks-like",
        title: "What 'good' looks like",
        icon: Gauge,
        body: (
          <>
            <BulletList
              items={[
                "Stable success rate over time",
                "Few repeats after fixes",
                "Predictable runtime",
                "Failures fail fast (no long chains of retries)",
              ]}
            />
          </>
        ),
      },
      {
        id: "slow-nodes",
        title: "Finding slow nodes",
        icon: Activity,
        body: (
          <>
            <p>
              Slow nodes are often external API calls, large AI prompts, or rate
              limiting. Use performance views and recent runs to spot patterns.
            </p>
          </>
        ),
      },
      {
        id: "repeat-failures",
        title: "Repeat failures",
        icon: ScrollText,
        body: (
          <>
            <p>
              If the same error repeats, treat it like a product bug. Fix once
              and confirm the error group stops growing.
            </p>
          </>
        ),
      },
    ],
  },

  {
    slug: "smoke-tests",
    title: "Smoke tests",
    summary: "Fast health checks across integrations and core surfaces.",
    icon: Shield,
    sections: [
      {
        id: "when",
        title: "When to run them",
        icon: Shield,
        body: (
          <>
            <BulletList
              items={[
                "After an integration change",
                "When many users report failures",
                "Before a demo or rollout",
              ]}
            />
          </>
        ),
      },
      {
        id: "where",
        title: "Where to run",
        icon: Activity,
        body: (
          <>
            <p>
              Run smoke tests at <InlineCode>/admin/smoke-tests</InlineCode>.
            </p>
          </>
        ),
      },
      {
        id: "how-to-use-results",
        title: "Using the results",
        icon: Gauge,
        body: (
          <>
            <p>
              A failure in smoke tests usually means a permission/scope issue or
              a provider outage. Validate by running a tiny workflow that reads
              and writes a safe target.
            </p>
          </>
        ),
      },
    ],
  },

  {
    slug: "incident-response",
    title: "Incident response",
    summary: "Stop harm, restore service, and prevent recurrence.",
    icon: Shield,
    sections: [
      {
        id: "stop-harm",
        title: "Stop harm",
        icon: Shield,
        body: (
          <>
            <BulletList
              items={[
                "Pause the offending workflow(s)",
                "Disable a compromised integration connection",
                "Reduce permissions if a workflow is too powerful",
              ]}
            />
          </>
        ),
      },
      {
        id: "restore",
        title: "Restore service",
        icon: Activity,
        body: (
          <>
            <BulletList
              items={[
                "Fix OAuth scopes / reconnect tokens",
                "Roll back a bad prompt/schema change",
                "Re-run smoke tests",
              ]}
            />
          </>
        ),
      },
      {
        id: "prevent",
        title: "Prevent recurrence",
        icon: ScrollText,
        body: (
          <>
            <p>
              Write down the root cause and the guardrail you&apos;re adding. The
              goal is: this class of failure shouldn&apos;t happen again.
            </p>
          </>
        ),
      },
    ],
  },

  {
    slug: "compliance-and-data-handling",
    title: "Compliance + data handling",
    summary: "Practical guidance for handling sensitive data in workflows.",
    icon: Lock,
    sections: [
      {
        id: "sensitive-data",
        title: "Know what is sensitive",
        icon: Lock,
        body: (
          <>
            <p>
              Treat customer data, credentials, and private internal docs as
              sensitive. Build workflows so secrets never need to be in prompts.
            </p>
          </>
        ),
      },
      {
        id: "practical-rules",
        title: "Practical rules",
        icon: Shield,
        body: (
          <>
            <BulletList
              items={[
                "Avoid sending secrets to AI",
                "Limit integrations to what's needed",
                "Prefer least privilege scopes",
                "Use audit logs for access reviews",
                "Add human review to high-impact workflows",
              ]}
            />
          </>
        ),
      },
      {
        id: "review",
        title: "Review process",
        icon: ScrollText,
        body: (
          <>
            <p>
              For compliance reviews, collect: list of admins, list of connected
              integrations, key workflows, and recent audit log exports.
            </p>
          </>
        ),
      },
    ],
  },
];
