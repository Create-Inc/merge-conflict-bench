<<<<<<< ours
import sql from "@/app/api/utils/sql";
import { requireTwoFactorVerified } from "@/app/api/utils/twoFactor";
import { resolveSession } from "@/app/api/utils/resolveSession";
import {
  mergeDuplicateEmailAccountsIntoUserId,
  resolveEffectiveUserIdentity,
} from "@/app/api/utils/userIdentity";
import { isAdminEmail } from "@/app/api/utils/admin";

function json(payload, init) {
  const body = JSON.stringify(payload ?? {});
  const headers = new Headers(init?.headers || undefined);

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  // This response is cookie/auth dependent. Never cache it.
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "private, no-store, max-age=0");
  }
  if (!headers.has("pragma")) {
    headers.set("pragma", "no-cache");
  }
  headers.set("vary", "cookie, authorization");

  // Helpful when debugging: confirm which route responded.
  headers.set("x-anything-api", "dashboard-data");

  return new Response(body, { ...init, headers });
}

function safeUrl(request) {
  try {
    return new URL(request.url);
  } catch (e) {
    const base =
      process.env.APP_URL || process.env.AUTH_URL || "http://localhost";
    return new URL(request.url, base);
  }
}

function buildPreviewAccounts() {
  const now = new Date().toISOString();
  return [
    {
      id: -1,
      account_type: "Checking",
      balance: 2450.75,
      currency: "USD",
      account_number: "****4521",
      group_name: "Lansdell Consulting LLC",
      created_at: now,
      funded_by_admin: true,
    },
    {
      id: -2,
      account_type: "Savings",
      balance: 8000.0,
      currency: "USD",
      account_number: "****1178",
      group_name: "Personal",
      created_at: now,
      funded_by_admin: true,
    },
  ];
}

function buildPreviewTransactions() {
  const now = Date.now();
  return [
    {
      id: 9001,
      account_id: -1,
      user_id: 0,
      transaction_type: "pending",
      amount: -125.0,
      description: "Transfer out (Pending)",
      merchant: null,
      created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      balance_after: null,
      affects_balance: false,
    },
    {
      id: 9002,
      account_id: -1,
      user_id: 0,
      transaction_type: "deposit",
      amount: 2200.0,
      description: "Initial deposit",
      merchant: "Online transfer",
      created_at: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      balance_after: 2450.75,
      affects_balance: true,
    },
    {
      id: 9003,
      account_id: -1,
      user_id: 0,
      transaction_type: "purchase",
      amount: -58.32,
      description: "Office supplies",
      merchant: "Staples",
      created_at: new Date(now - 1000 * 60 * 60 * 52).toISOString(),
      balance_after: 309.07,
      affects_balance: true,
    },
  ];
}

function generateAccountNumber(userId) {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const stamp = Date.now();
  return `${userId}${stamp}${rand}`;
}

async function ensureDefaultAccountsForUser(userId) {
  const existing = await sql(
    "SELECT id FROM accounts WHERE user_id = $1 LIMIT 1",
    [userId],
  );

  if (existing.length > 0) {
    return;
  }

  const defaults = [
    { accountType: "Checking", groupName: "Personal" },
    { accountType: "Savings", groupName: "Personal" },
  ];

  for (const def of defaults) {
    let inserted = false;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const accountNumberValue = generateAccountNumber(userId);
      const result = await sql(
        "INSERT INTO accounts (user_id, account_type, balance, currency, account_number, funded_by_admin, group_name) VALUES ($1, $2, 0, 'USD', $3, false, $4) ON CONFLICT (account_number) DO NOTHING RETURNING id",
        [userId, def.accountType, accountNumberValue, def.groupName],
      );

      if (result.length > 0) {
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      console.error(
        `Could not auto-create ${def.accountType} for user ${userId} after retries (account_number collisions).`,
      );
    }
  }
}

async function applyUnfundedZeroing(userId) {
  // Keep balances at $0 until an admin funds them.
  // This is consistent with /api/accounts.
  await sql(
    "UPDATE accounts SET balance = 0 WHERE user_id = $1 AND LOWER(account_type) IN ('checking', 'business checking', 'savings', 'credit card', 'auto loan') AND (funded_by_admin IS NOT TRUE)",
    [userId],
  );
}

export async function GET(request) {
  try {
    const session = await resolveSession(request);

    // Signed out: return preview payload so UI can still render.
    if (!session || !session.user?.id) {
      return json({
        accounts: buildPreviewAccounts(),
        transactions: buildPreviewTransactions(),
        goals: [],
        preview: true,
      });
    }

    const identity = await resolveEffectiveUserIdentity({
      userId: session.user.id,
      email: session.user?.email || null,
    });

    if (!identity?.id) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(identity.id);
    if (!Number.isFinite(userId)) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const twoFactorBlock = requireTwoFactorVerified(request, userId, {
      ...session.user,
      email: identity.email || session.user?.email || null,
    });

    if (twoFactorBlock) {
      // Ensure the response is never cached and is always tagged.
      const text = await twoFactorBlock.text();
      const headers = new Headers(twoFactorBlock.headers);

      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json; charset=utf-8");
      }
      headers.set("cache-control", "private, no-store, max-age=0");
      headers.set("pragma", "no-cache");
      headers.set("vary", "cookie, authorization");
      headers.set("x-anything-api", "dashboard-data");

      return new Response(
        text || JSON.stringify({ error: "Two-factor verification required" }),
        {
          status: twoFactorBlock.status,
          statusText: twoFactorBlock.statusText,
          headers,
        },
      );
    }

    const mergeEmail = identity.email || session.user?.email || null;
    await mergeDuplicateEmailAccountsIntoUserId({ userId, email: mergeEmail });

    await ensureDefaultAccountsForUser(userId);
    await applyUnfundedZeroing(userId);

    const [accounts, transactions, goals] = await sql.transaction((txn) => [
      txn(
        "SELECT id, account_type, balance, currency, account_number, group_name, display_name, routing_number, created_at, funded_by_admin FROM accounts WHERE user_id = $1 ORDER BY created_at DESC",
        [userId],
      ),
      txn(
        `SELECT t.id, t.account_id, t.user_id, t.transaction_type, t.amount, t.description, t.merchant, t.created_at, t.balance_after, t.affects_balance
         FROM transactions t
         INNER JOIN accounts a ON t.account_id = a.id
         WHERE a.user_id = $1
         ORDER BY t.created_at DESC
         LIMIT 50`,
        [userId],
      ),
      txn(
        "SELECT id, name, target_amount, current_amount, gradient, created_at FROM goals WHERE user_id = $1 ORDER BY created_at DESC",
        [userId],
      ),
    ]);

    const { searchParams } = safeUrl(request);
    const wantsDebug = searchParams.get("debug") === "1";
    const admin = isAdminEmail(session.user?.email || null);

    if (wantsDebug && admin) {
      return json({
        accounts,
        transactions,
        goals,
        debug: {
          sessionUserId: session.user?.id || null,
          effectiveUserId: userId,
          resolvedEmail: mergeEmail || null,
          accountCount: Array.isArray(accounts) ? accounts.length : 0,
          txCount: Array.isArray(transactions) ? transactions.length : 0,
          goalCount: Array.isArray(goals) ? goals.length : 0,
        },
      });
    }

    return json({ accounts, transactions, goals });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}
=======
import sql from "@/app/api/utils/sql";
import { requireTwoFactorVerified } from "@/app/api/utils/twoFactor";
import { resolveSession } from "@/app/api/utils/resolveSession";
import {
  mergeDuplicateEmailAccountsIntoUserId,
  resolveEffectiveUserIdentity,
} from "@/app/api/utils/userIdentity";

function json(payload, init) {
  const body = JSON.stringify(payload ?? {});

  const headers = new Headers(init?.headers || undefined);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }

  // User-specific endpoint — never cache.
  headers.set("cache-control", "private, no-store, max-age=0");
  headers.set("pragma", "no-cache");
  headers.set("vary", "cookie, authorization");

  // Debug tag
  headers.set("x-anything-api", "dashboard-data");

  return new Response(body, { ...init, headers });
}

function buildPreviewAccounts() {
  const now = new Date().toISOString();
  return [
    {
      id: -1,
      account_type: "Checking",
      balance: 2450.75,
      currency: "USD",
      account_number: "****4521",
      group_name: "Lansdell Consulting LLC",
      created_at: now,
      funded_by_admin: true,
    },
    {
      id: -2,
      account_type: "Savings",
      balance: 8000.0,
      currency: "USD",
      account_number: "****1178",
      group_name: "Personal",
      created_at: now,
      funded_by_admin: true,
    },
  ];
}

function buildPreviewTransactions() {
  const now = Date.now();
  // Tie preview transactions to the first preview account.
  const accountId = -1;

  return [
    {
      id: 9001,
      account_id: accountId,
      user_id: 0,
      transaction_type: "pending",
      amount: -125.0,
      description: "Transfer out (Pending)",
      merchant: null,
      created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      balance_after: null,
      affects_balance: false,
    },
    {
      id: 9002,
      account_id: accountId,
      user_id: 0,
      transaction_type: "deposit",
      amount: 2200.0,
      description: "Initial deposit",
      merchant: "Online transfer",
      created_at: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      balance_after: 2450.75,
      affects_balance: true,
    },
    {
      id: 9003,
      account_id: accountId,
      user_id: 0,
      transaction_type: "purchase",
      amount: -58.32,
      description: "Office supplies",
      merchant: "Staples",
      created_at: new Date(now - 1000 * 60 * 60 * 52).toISOString(),
      balance_after: 309.07,
      affects_balance: true,
    },
  ];
}

function generateAccountNumber(userId) {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const stamp = Date.now();
  return `${userId}${stamp}${rand}`;
}

async function ensureDefaultAccountsForUser(userId) {
  const existing = await sql`
    SELECT id
    FROM accounts
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (existing.length > 0) {
    return;
  }

  const defaults = [
    { accountType: "Checking", groupName: "Personal" },
    { accountType: "Savings", groupName: "Personal" },
  ];

  for (const def of defaults) {
    let inserted = false;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const accountNumberValue = generateAccountNumber(userId);

      const result = await sql`
        INSERT INTO accounts (user_id, account_type, balance, currency, account_number, funded_by_admin, group_name)
        VALUES (${userId}, ${def.accountType}, 0, 'USD', ${accountNumberValue}, false, ${def.groupName})
        ON CONFLICT (account_number) DO NOTHING
        RETURNING id
      `;

      if (result.length > 0) {
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      console.error(
        `Could not auto-create ${def.accountType} for user ${userId} after retries (account_number collisions).`,
      );
    }
  }
}

export async function GET(request) {
  try {
    const session = await resolveSession(request);

    // Signed out: give preview data so the dashboard can still render.
    if (!session || !session.user?.id) {
      return json({
        preview: true,
        accounts: buildPreviewAccounts(),
        transactions: buildPreviewTransactions(),
        goals: [],
      });
    }

    const identity = await resolveEffectiveUserIdentity({
      userId: session.user.id,
      email: session.user?.email || null,
    });

    if (!identity?.id) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(identity.id);
    if (!Number.isFinite(userId)) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const twoFactorBlock = requireTwoFactorVerified(request, userId, {
      ...session.user,
      email: identity.email || session.user?.email || null,
    });
    if (twoFactorBlock) {
      // Ensure we keep our no-store headers.
      const text = await twoFactorBlock.text();
      let payload = null;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { error: "Two-factor verification required" };
      }
      return json(payload, { status: twoFactorBlock.status || 403 });
    }

    const mergeEmail = identity.email || session.user?.email || null;
    await mergeDuplicateEmailAccountsIntoUserId({ userId, email: mergeEmail });

    // Always ensure baseline accounts exist so the dashboard never lands empty.
    await ensureDefaultAccountsForUser(userId);

    // Keep deposit-like accounts at $0 until an admin explicitly funds them.
    await sql`
      UPDATE accounts
      SET balance = 0
      WHERE user_id = ${userId}
        AND LOWER(account_type) IN ('checking', 'business checking', 'savings', 'credit card', 'auto loan')
        AND (funded_by_admin IS NOT TRUE)
    `;

    const accounts = await sql`
      SELECT id, account_type, balance, currency, account_number, group_name, display_name, routing_number, created_at, funded_by_admin
      FROM accounts
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    // Default: current user's transactions across all accounts.
    const transactions = await sql(
      `SELECT t.id, t.account_id, t.user_id, t.transaction_type, t.amount, t.description, t.merchant, t.created_at, t.balance_after, t.affects_balance
       FROM transactions t
       INNER JOIN accounts a ON t.account_id = a.id
       WHERE a.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [userId],
    );

    const goals = await sql`
      SELECT id, name, target_amount, current_amount, gradient, created_at
      FROM goals
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    // Defensive: always return arrays.
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const safeGoals = Array.isArray(goals) ? goals : [];

    return json({
      accounts: safeAccounts,
      transactions: safeTransactions,
      goals: safeGoals,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}
>>>>>>> theirs
