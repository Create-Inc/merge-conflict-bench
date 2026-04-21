import sql from "@/app/api/utils/sql";
import { requireCompany, isCompanyAdmin } from "@/app/api/utils/tenant";
import {
  createJournalEntryInTxn,
  getAccountCodesFromCompany,
} from "@/app/api/utils/erp";
import { nextDocNumber } from "@/app/api/utils/numbering";

function toMoneyNumber(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

// Tax is a percentage (e.g. 15 means 15%)
function clampPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function computeVatFromAmount({ amountTotalOrSubtotal, taxRatePct, taxInclusive }) {
  const amt = toMoneyNumber(amountTotalOrSubtotal);
  const ratePct = clampPct(taxRatePct);
  const rate = ratePct / 100;

  if (!ratePct || ratePct <= 0) {
    return {
      vatAmount: 0,
      amountTotal: amt,
      taxRatePct: ratePct,
      taxInclusive: !!taxInclusive,
    };
  }

  // If taxInclusive=true, treat entered amount as total (incl tax) and back-calc VAT portion.
  if (taxInclusive) {
    const subtotal = amt / (1 + rate);
    const vatAmount = toMoneyNumber(amt - subtotal);
    return { vatAmount, amountTotal: amt, taxRatePct: ratePct, taxInclusive: true };
  }

  // If taxInclusive=false, treat entered amount as subtotal (excl tax) and compute total.
  const vatAmount = toMoneyNumber(amt * rate);
  const amountTotal = toMoneyNumber(amt + vatAmount);
  return { vatAmount, amountTotal, taxRatePct: ratePct, taxInclusive: false };
}

async function computeSalesOrderCogsInTxn(txn, { companyId, salesOrderId }) {
  const soId = Number(salesOrderId);
  if (!Number.isFinite(soId)) return 0;

  const rows = await txn`
    SELECT
      COALESCE(SUM(soi.quantity * COALESCE(p.average_cost, 0)), 0) AS total_cost
    FROM sales_order_items soi
    LEFT JOIN products p
      ON p.id = soi.product_id
     AND p.company_id = soi.company_id
    WHERE soi.company_id = ${companyId}
      AND soi.sales_order_id = ${soId}
  `;

  const totalCost = toMoneyNumber(rows?.[0]?.total_cost);
  return totalCost;
}

export async function GET(request) {
  try {
    const { company, error } = await requireCompany(request);
    if (error) {
      return error;
    }

    const invoices = await sql`
      SELECT
        i.*,
        so.order_number AS sales_order_number,
        q.quote_number AS quote_number,
        COALESCE(p.total_paid, 0) AS total_paid,
        p.last_payment_at,
        COALESCE(cn.total_credited, 0) AS total_credited,
        COALESCE(rf.total_refunded, 0) AS total_refunded
      FROM invoices i
      LEFT JOIN sales_orders so ON i.sales_order_id = so.id
      LEFT JOIN quotes q ON so.quote_id = q.id
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(ip.amount), 0) AS total_paid,
               MAX(ip.paid_at) AS last_payment_at
        FROM invoice_payments ip
        WHERE ip.company_id = i.company_id AND ip.invoice_id = i.id
      ) p ON TRUE
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(icn.amount), 0) AS total_credited
        FROM invoice_credit_notes icn
        WHERE icn.company_id = i.company_id AND icn.invoice_id = i.id
      ) cn ON TRUE
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(ir.amount), 0) AS total_refunded
        FROM invoice_refunds ir
        WHERE ir.company_id = i.company_id AND ir.invoice_id = i.id
      ) rf ON TRUE
      WHERE i.company_id = ${company.id}
      ORDER BY i.created_at DESC
    `;

    return Response.json({ invoices });
  } catch (err) {
    console.error("GET /api/invoices error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { session, company, error } = await requireCompany(request);
    if (error) {
      return error;
    }

    // financial posting is admin-only
    if (!isCompanyAdmin(company)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      invoiceNumber,
      customerName,
      customerEmail,
      amount,
      vatAmount, // legacy / override: explicit VAT amount
      taxRate, // percent (e.g. 15 for 15%)
      taxInclusive, // if false, treat `amount` as subtotal and compute total
      issueDate,
      dueDate,
      status,
      notes,
      salesOrderId,
    } = body;

    const customerNameValue = String(customerName || "").trim();
    const invoiceNumberValue =
      typeof invoiceNumber === "string" ? invoiceNumber.trim() : "";

    if (!customerNameValue || amount === undefined) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber < 0) {
      return Response.json(
        { error: "Amount must be a non-negative number" },
        { status: 400 },
      );
    }

    const hasVatOverride =
      vatAmount !== undefined && vatAmount !== null && vatAmount !== "";
    const vatOverrideNumber = hasVatOverride ? Number(vatAmount) : null;
    if (hasVatOverride && (!Number.isFinite(vatOverrideNumber) || vatOverrideNumber < 0)) {
      return Response.json(
        { error: "vatAmount must be a non-negative number" },
        { status: 400 },
      );
    }

    const hasTaxRate = taxRate !== undefined && taxRate !== null && taxRate !== "";
    const effectiveTaxInclusive = taxInclusive !== false; // default true

    const computed = hasTaxRate
      ? computeVatFromAmount({
          amountTotalOrSubtotal: amountNumber,
          taxRatePct: taxRate,
          taxInclusive: effectiveTaxInclusive,
        })
      : {
          vatAmount: 0,
          amountTotal: toMoneyNumber(amountNumber),
          taxRatePct: 0,
          taxInclusive: false,
        };

    const vatAmountNumber = hasVatOverride
      ? toMoneyNumber(vatOverrideNumber)
      : toMoneyNumber(computed.vatAmount);

    // If taxInclusive=false, treat input as subtotal and store computed total.
    // If vatAmount override is provided, use it to compute total too.
    const wantsExclusive = taxInclusive === false;
    const amountTotalNumber = wantsExclusive
      ? toMoneyNumber(amountNumber + vatAmountNumber)
      : toMoneyNumber(amountNumber);

    // Guard: VAT should never exceed total.
    if (vatAmountNumber > amountTotalNumber) {
      return Response.json(
        { error: "VAT amount cannot be greater than the invoice amount" },
        { status: 400 },
      );
    }

    // lock down allowed create statuses (avoid inconsistent states)
    const rawStatus = typeof status === "string" ? status.trim() : "draft";
    const statusValue = rawStatus === "sent" ? "pending" : rawStatus;
    const allowed = new Set(["draft", "pending"]);
    if (!allowed.has(statusValue)) {
      return Response.json(
        { error: "status must be draft or pending" },
        { status: 400 },
      );
    }

    // balance_due is always derived at create time
    const balanceDueNumber = amountTotalNumber;

    const invoice = await sql.transaction(async (txn) => {
      const invNo = invoiceNumberValue
        ? invoiceNumberValue
        : await nextDocNumber(txn, company.id, "invoice", new Date());

      const storedTaxRatePct = hasTaxRate ? clampPct(taxRate) : 0;
      const storedTaxInclusive = hasTaxRate ? effectiveTaxInclusive : false;

      const invoiceRows = await txn`
        INSERT INTO invoices (
          company_id,
          invoice_number,
          customer_name,
          customer_email,
          amount,
          balance_due,
          vat_amount,
          tax_rate,
          tax_inclusive,
          issue_date,
          due_date,
          status,
          notes,
          sales_order_id
        )
        VALUES (
          ${company.id},
          ${invNo},
          ${customerNameValue},
          ${customerEmail || null},
          ${amountTotalNumber},
          ${balanceDueNumber},
          ${toMoneyNumber(vatAmountNumber)},
          ${storedTaxRatePct},
          ${storedTaxInclusive},
          ${issueDate || null},
          ${dueDate || null},
          ${statusValue},
          ${notes || null},
          ${salesOrderId || null}
        )
        RETURNING *
      `;

      const createdInvoice = invoiceRows?.[0] || null;

      // Post to GL when not draft
      if (createdInvoice && statusValue !== "draft" && amountTotalNumber > 0) {
        const accounts = getAccountCodesFromCompany(company);

        // If this invoice came from a sales order, also recognize COGS at invoice time.
        const cogsAmount = createdInvoice.sales_order_id
          ? await computeSalesOrderCogsInTxn(txn, {
              companyId: company.id,
              salesOrderId: createdInvoice.sales_order_id,
            })
          : 0;

        const lines = [
          {
            accountCode: accounts.ar,
            debit: amountTotalNumber,
            credit: 0,
            description: "Accounts receivable",
          },
          {
            accountCode: accounts.revenue,
            debit: 0,
            credit: amountTotalNumber,
            description: "Revenue",
          },
        ];

        if (cogsAmount > 0) {
          lines.push(
            {
              accountCode: accounts.cogs,
              debit: cogsAmount,
              credit: 0,
              description: "Cost of goods sold",
            },
            {
              accountCode: accounts.inventory,
              debit: 0,
              credit: cogsAmount,
              description: "Inventory",
            },
          );
        }

        await createJournalEntryInTxn(txn, {
          companyId: company.id,
          entryDate: new Date().toISOString().slice(0, 10),
          referenceType: "invoice",
          referenceId: createdInvoice.id,
          memo: `Invoice ${createdInvoice.invoice_number}`,
          createdBy: userId,
          lines,
        });
      }

      return createdInvoice;
    });

    return Response.json({ invoice });
  } catch (err) {
    console.error("POST /api/invoices error:", err);
    const msg = String(err?.message || "");
    const lower = msg.toLowerCase();

    if (lower.includes("period is locked") || lower.includes("unknown account code")) {
      return Response.json({ error: msg }, { status: 400 });
    }

    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
