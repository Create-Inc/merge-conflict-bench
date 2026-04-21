import sql from "@/app/api/utils/sql";
import { requireCompany, isCompanyAdmin } from "@/app/api/utils/tenant";
import { ensureDefaultChatChannels } from "@/app/api/utils/erp";
import { hash } from "argon2";

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

const ALLOWED_ROLES = [
  "super_admin",
  "director",
  "operations",
  "manager",
  "admin",
  "dept_head",
  "supervisor",
  "general",
  "intern",
];

function normalizeEmail(input) {
  const raw = String(input || "")
    .trim()
    .toLowerCase();
  if (!raw) return null;
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
  return ok ? raw : null;
}

function safeText(input) {
  const s = typeof input === "string" ? input.trim() : "";
  return s ? s : null;
}

function isIsoDateOnly(value) {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

function isEndOnOrAfterStart(start, end) {
  try {
    const a = new Date(`${start}T00:00:00Z`).getTime();
    const b = new Date(`${end}T00:00:00Z`).getTime();
    return Number.isFinite(a) && Number.isFinite(b) && b >= a;
  } catch {
    return false;
  }
}

function splitName(name) {
  const n = String(name || "").trim();
  if (!n) return { firstName: null, lastName: null };
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

function makeTempPassword() {
  try {
    const s = crypto.randomUUID().replace(/-/g, "");
    return s.slice(0, 12);
  } catch {
    return String(Math.random()).slice(2, 14);
  }
}

function errorToMessage(err) {
  if (!err) return "Internal Server Error";
  if (typeof err === "string") return err;
  if (typeof err?.message === "string" && err.message.trim()) {
    return err.message;
  }
  if (typeof err?.detail === "string" && err.detail.trim()) {
    return err.detail;
  }
  return "Internal Server Error";
}

function normalizeDepartmentIdArray(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  const seen = new Set();
  for (const v of value) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    const key = String(n);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

async function validateDepartmentsExist({ companyId, departmentIds }) {
  if (!departmentIds?.length) return { ok: true, departmentIds: [] };

  const rows = await sql(
    "SELECT id FROM departments WHERE company_id = $1 AND id = ANY($2::int[])",
    [companyId, departmentIds],
  );

  const found = new Set((rows || []).map((r) => Number(r.id)));
  const missing = departmentIds.filter((id) => !found.has(Number(id)));
  if (missing.length) {
    return { ok: false, error: "One or more headDepartmentIds are invalid" };
  }

  return { ok: true, departmentIds };
}

async function setUserAsHeadForDepartments({
  companyId,
  userId,
  departmentIds,
}) {
  const ids = Array.isArray(departmentIds) ? departmentIds : [];
  if (!ids.length) return;

  await sql(
    "UPDATE departments SET head_user_id = $1 WHERE company_id = $2 AND id = ANY($3::int[])",
    [userId, companyId, ids],
  );

  // Best effort: make sure they're members of those departments too and mark as head.
  try {
    await sql(
      `
        INSERT INTO department_members (company_id, department_id, user_id, role)
        SELECT $1, d, $2, 'head'
        FROM UNNEST($3::int[]) AS d
        ON CONFLICT (company_id, department_id, user_id)
        DO UPDATE SET role = 'head'
      `,
      [companyId, userId, ids],
    );
  } catch (e) {
    console.error("ensure department_members for heads failed", e);
  }
}

export async function POST(request) {
  try {
    const { company, session, error } = await requireCompany(request);
    if (error) return error;

    if (!isCompanyAdmin(company)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));

    const email = normalizeEmail(body?.email);
    if (!email) {
      return Response.json({ error: "Valid email is required" }, { status: 400 });
    }

    const name = safeText(body?.name);
    let firstName = safeText(body?.firstName);
    let lastName = safeText(body?.lastName);
    if (!firstName || lastName === null) {
      // fallback for older clients sending only `name`
      const parsed = splitName(name);
      if (!firstName) firstName = safeText(parsed.firstName);
      if (lastName === null) lastName = safeText(parsed.lastName);
    }

    if (!firstName || !lastName) {
      return Response.json(
        { error: "firstName and lastName are required" },
        { status: 400 },
      );
    }

    const deptId = body?.departmentId ? Number(body.departmentId) : null;
    if (!Number.isFinite(deptId)) {
      return Response.json({ error: "departmentId is required" }, { status: 400 });
    }

    const deptRows = await sql`
      SELECT id
      FROM departments
      WHERE company_id = ${company.id}
        AND id = ${deptId}
      LIMIT 1
    `;
    if (!deptRows?.[0]) {
      return Response.json({ error: "Invalid departmentId" }, { status: 400 });
    }

    const start =
      typeof body?.termStartDate === "string" ? body.termStartDate.trim() : "";
    const end =
      typeof body?.termEndDate === "string" ? body.termEndDate.trim() : "";

    if (!isIsoDateOnly(start) || !isIsoDateOnly(end)) {
      return Response.json(
        { error: "termStartDate and termEndDate are required (YYYY-MM-DD)" },
        { status: 400 },
      );
    }
    if (!isEndOnOrAfterStart(start, end)) {
      return Response.json(
        { error: "termEndDate must be the same day or after termStartDate" },
        { status: 400 },
      );
    }

    const isIntern = typeof body?.isIntern === "boolean" ? body.isIntern : false;
    const setAsDepartmentHead = !!body?.setAsDepartmentHead;

    const desiredRole = normalizeRole(body?.role || "general");
    const role = ALLOWED_ROLES.includes(desiredRole) ? desiredRole : null;
    if (!role) {
      return Response.json(
        { error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}` },
        { status: 400 },
      );
    }

    // Treat dept_head role OR explicit checkbox as "department head" intent
    const shouldBeDeptHead = role === "dept_head" || setAsDepartmentHead;

    // Optional: allow setting this user as a head/approver for additional departments.
    const headDepartmentIdsRaw = normalizeDepartmentIdArray(body?.headDepartmentIds);
    const headValidation = await validateDepartmentsExist({
      companyId: company.id,
      departmentIds: headDepartmentIdsRaw,
    });
    if (!headValidation.ok) {
      return Response.json({ error: headValidation.error }, { status: 400 });
    }

    const headDeptIds = (() => {
      const ids = [...headValidation.departmentIds];
      if (shouldBeDeptHead) {
        ids.push(deptId);
      }
      const out = [];
      const seen = new Set();
      for (const id of ids) {
        const n = Number(id);
        if (!Number.isFinite(n)) continue;
        const key = String(n);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(n);
      }
      return out;
    })();

    const rawPassword = typeof body?.password === "string" ? body.password : "";
    const trimmedPassword = rawPassword.trim();
    const password = trimmedPassword ? trimmedPassword : makeTempPassword();

    const fullName = `${firstName} ${lastName}`.trim();

    // If the user already exists, just add them to this company.
    const existingRows = await sql`
      SELECT id, name, email
      FROM auth_users
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    const existing = existingRows?.[0] || null;

    if (existing?.id) {
      const existingUserId = Number(existing.id);

      if (!Number.isFinite(existingUserId)) {
        return Response.json({ error: "Invalid user id" }, { status: 500 });
      }

      const cuRows = await sql`
        INSERT INTO company_users (user_id, company_id, role)
        VALUES (${existingUserId}, ${company.id}, ${role})
        ON CONFLICT (user_id, company_id)
        DO UPDATE SET role = EXCLUDED.role
        RETURNING user_id, company_id, role
      `;

      // If the user exists but doesn't have credentials yet, create one.
      let tempPassword = null;
      try {
        const accRows = await sql`
          SELECT id
          FROM auth_accounts
          WHERE "userId" = ${existingUserId}
            AND provider = 'credentials'
          LIMIT 1
        `;

        const hasCredentials = (accRows || []).length > 0;
        if (!hasCredentials) {
          const passwordHash = await hash(password);
          await sql`
            INSERT INTO auth_accounts (
              "userId",
              type,
              provider,
              "providerAccountId",
              password
            )
            VALUES (
              ${existingUserId},
              'credentials',
              'credentials',
              ${existingUserId},
              ${passwordHash}
            )
          `;
          tempPassword = password;
        }
      } catch (e) {
        console.error("ensure credentials account failed", e);
      }

      // Upsert employee record for HR
      let employeeId = null;
      try {
        const empRows = await sql`
          SELECT id
          FROM employees
          WHERE company_id = ${company.id}
            AND user_id = ${existingUserId}
          LIMIT 1
        `;
        const existingEmpId = empRows?.[0]?.id ? Number(empRows[0].id) : null;

        if (Number.isFinite(existingEmpId)) {
          employeeId = existingEmpId;
          await sql`
            UPDATE employees
            SET
              first_name = ${firstName},
              last_name = ${lastName},
              email = ${email},
              department_id = ${deptId},
              is_intern = ${isIntern},
              term_start_date = ${start},
              term_end_date = ${end}
            WHERE company_id = ${company.id}
              AND id = ${existingEmpId}
          `;
        } else {
          const insRows = await sql`
            INSERT INTO employees (
              company_id,
              user_id,
              first_name,
              last_name,
              email,
              department_id,
              is_intern,
              status,
              term_start_date,
              term_end_date
            )
            VALUES (
              ${company.id},
              ${existingUserId},
              ${firstName},
              ${lastName},
              ${email},
              ${deptId},
              ${isIntern},
              'active',
              ${start},
              ${end}
            )
            RETURNING id
          `;
          employeeId = insRows?.[0]?.id ? Number(insRows[0].id) : null;
        }
      } catch (e) {
        console.error("upsert employee from invite failed", e);
      }

      // Ensure department membership (head vs member)
      try {
        if (shouldBeDeptHead) {
          await sql`
            INSERT INTO department_members (company_id, department_id, user_id, role)
            VALUES (${company.id}, ${deptId}, ${existingUserId}, 'head')
            ON CONFLICT (company_id, department_id, user_id)
            DO UPDATE SET role = 'head'
          `;
        } else {
          await sql`
            INSERT INTO department_members (company_id, department_id, user_id, role)
            VALUES (${company.id}, ${deptId}, ${existingUserId}, 'member')
            ON CONFLICT (company_id, department_id, user_id)
            DO NOTHING
          `;
        }
      } catch (e) {
        console.error("insert department member failed", e);
      }

      // Optional: set them as head/approver of departments (includes selected department when requested)
      if (headDeptIds.length) {
        try {
          await setUserAsHeadForDepartments({
            companyId: company.id,
            userId: existingUserId,
            departmentIds: headDeptIds,
          });
        } catch (e) {
          console.error("set department heads failed", e);
        }
      }

      // Best-effort: ensure chat exists.
      try {
        await ensureDefaultChatChannels(company.id, {
          createdBy: session?.user?.id || existingUserId,
        });
      } catch (e) {
        console.error("ensureDefaultChatChannels failed", e);
      }

      return Response.json({
        ok: true,
        user: {
          id: existingUserId,
          email: existing.email,
          name: existing.name || fullName,
          role: cuRows?.[0]?.role || role,
        },
        employeeId,
        tempPassword,
        message:
          "User already existed. Added them to this workspace (or updated their role).",
        alreadyExisted: true,
      });
    }

    const passwordHash = await hash(password);

    // Create auth user + credentials account + company role
    const query = `
      WITH new_user AS (
        INSERT INTO auth_users (name, email)
        VALUES ($1, $2)
        RETURNING id
      ),
      new_account AS (
        INSERT INTO auth_accounts (
          "userId",
          type,
          provider,
          "providerAccountId",
          password
        )
        SELECT
          id,
          'credentials',
          'credentials',
          id,
          $3
        FROM new_user
        RETURNING id
      ),
      new_company_user AS (
        INSERT INTO company_users (user_id, company_id, role)
        SELECT id, $4, $5
        FROM new_user
        ON CONFLICT (user_id, company_id)
        DO UPDATE SET role = EXCLUDED.role
        RETURNING id
      )
      SELECT (SELECT id FROM new_user) AS user_id
    `;

    const rows = await sql(query, [
      fullName || name,
      email,
      passwordHash,
      company.id,
      role,
    ]);

    const userId = rows?.[0]?.user_id ? Number(rows[0].user_id) : null;

    if (!Number.isFinite(userId)) {
      return Response.json({ error: "Could not create user" }, { status: 500 });
    }

    // Create employee record for HR (minimal - more details can be filled later)
    let employeeId = null;
    try {
      const empRows = await sql`
        INSERT INTO employees (
          company_id,
          user_id,
          first_name,
          last_name,
          email,
          department_id,
          is_intern,
          status,
          term_start_date,
          term_end_date
        )
        VALUES (
          ${company.id},
          ${userId},
          ${firstName},
          ${lastName},
          ${email},
          ${deptId},
          ${isIntern},
          'active',
          ${start},
          ${end}
        )
        RETURNING id
      `;
      employeeId = empRows?.[0]?.id ? Number(empRows[0].id) : null;
    } catch (e) {
      console.error("create employee from invite failed", e);
    }

    // Ensure department membership (head vs member)
    try {
      if (shouldBeDeptHead) {
        await sql`
          INSERT INTO department_members (company_id, department_id, user_id, role)
          VALUES (${company.id}, ${deptId}, ${userId}, 'head')
          ON CONFLICT (company_id, department_id, user_id)
          DO UPDATE SET role = 'head'
        `;
      } else {
        await sql`
          INSERT INTO department_members (company_id, department_id, user_id, role)
          VALUES (${company.id}, ${deptId}, ${userId}, 'member')
          ON CONFLICT (company_id, department_id, user_id)
          DO NOTHING
        `;
      }
    } catch (e) {
      console.error("insert department member failed", e);
    }

    // Optional: set them as head/approver of departments (includes selected department when requested)
    if (headDeptIds.length) {
      try {
        await setUserAsHeadForDepartments({
          companyId: company.id,
          userId,
          departmentIds: headDeptIds,
        });
      } catch (e) {
        console.error("set department heads failed", e);
      }
    }

    // Best-effort: ensure chat exists.
    try {
      await ensureDefaultChatChannels(company.id, {
        createdBy: session?.user?.id || userId,
      });
    } catch (e) {
      console.error("ensureDefaultChatChannels failed", e);
    }

    return Response.json({
      ok: true,
      user: { id: userId, email, name: fullName || name, role },
      employeeId,
      tempPassword: password,
      message:
        "User created. Share the temporary password with them so they can sign in, then change it.",
      alreadyExisted: false,
    });
  } catch (err) {
    console.error("POST /api/company-users/invite error:", err);
    return Response.json({ error: errorToMessage(err) }, { status: 500 });
  }
}
