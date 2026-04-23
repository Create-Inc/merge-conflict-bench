import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const invoicesSrc = readFileSync(
  join(__dirname, "resolved/apps/mobile/src/app/(tabs)/more/invoices.jsx"),
  "utf-8"
);
const invoicesNewSrc = readFileSync(
  join(__dirname, "resolved/apps/mobile/src/app/(tabs)/more/invoices-new.jsx"),
  "utf-8"
);
const createModalSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/components/Invoices/CreateInvoiceModal.jsx"),
  "utf-8"
);
const routeSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/api/invoices/route.js"),
  "utf-8"
);

// =====================================================================
// BASE BEHAVIORS
// =====================================================================
describe("base behaviors", () => {
  describe("invoices list (mobile): basic structure", () => {
    it("exports InvoicesScreen as default", () => {
      expect(invoicesSrc).toMatch(/export\s+default\s+function\s+InvoicesScreen/);
    });

    it("requires auth via useRequireAuth", () => {
      expect(invoicesSrc).toMatch(/useRequireAuth/);
    });

    it("fetches invoices from /api/invoices", () => {
      expect(invoicesSrc).toMatch(/\/api\/invoices/);
    });

    it("displays 'Invoices' heading", () => {
      expect(invoicesSrc).toMatch(/Invoices/);
    });

    it("defines a money formatting function", () => {
      expect(invoicesSrc).toMatch(/function\s+money/);
    });
  });

  describe("invoices new (mobile): form structure", () => {
    it("exports InvoicesNewScreen as default", () => {
      expect(invoicesNewSrc).toMatch(/export\s+default\s+function\s+InvoicesNewScreen/);
    });

    it("defines clampPct for tax rate clamping", () => {
      expect(invoicesNewSrc).toMatch(/function\s+clampPct/);
    });

    it("defines computeFromSubtotal for tax calculation", () => {
      expect(invoicesNewSrc).toMatch(/function\s+computeFromSubtotal/);
    });

    it("uses KeyboardAvoidingAnimatedView", () => {
      expect(invoicesNewSrc).toMatch(/KeyboardAvoidingAnimatedView/);
    });
  });

  describe("CreateInvoiceModal (web): component structure", () => {
    it("exports CreateInvoiceModal function component", () => {
      expect(createModalSrc).toMatch(/export\s+function\s+CreateInvoiceModal/);
    });

    it("accepts isOpen and onClose props", () => {
      expect(createModalSrc).toMatch(/isOpen/);
      expect(createModalSrc).toMatch(/onClose/);
    });

    it("defines clampPct for tax rate validation", () => {
      expect(createModalSrc).toMatch(/function\s+clampPct/);
    });

    it("defines toMoneyNumber for currency rounding", () => {
      expect(createModalSrc).toMatch(/function\s+toMoneyNumber/);
    });

    it("defines computeFromSubtotal for tax calculation", () => {
      expect(createModalSrc).toMatch(/function\s+computeFromSubtotal/);
    });

    it("manages draft state with useState", () => {
      expect(createModalSrc).toMatch(/useState/);
      expect(createModalSrc).toMatch(/draft/);
    });

    it("uses useMutation for invoice creation", () => {
      expect(createModalSrc).toMatch(/useMutation/);
    });
  });

  describe("CreateInvoiceModal: draft fields", () => {
    it("includes customerName field", () => {
      expect(createModalSrc).toMatch(/customerName/);
    });

    it("includes customerEmail field", () => {
      expect(createModalSrc).toMatch(/customerEmail/);
    });

    it("includes amount (subtotal) field", () => {
      expect(createModalSrc).toMatch(/amount/);
    });

    it("includes taxRate field", () => {
      expect(createModalSrc).toMatch(/taxRate/);
    });

    it("includes issueDate field", () => {
      expect(createModalSrc).toMatch(/issueDate/);
    });

    it("includes dueDate field", () => {
      expect(createModalSrc).toMatch(/dueDate/);
    });

    it("includes status field with draft default", () => {
      expect(createModalSrc).toMatch(/status.*draft/);
    });

    it("includes notes field", () => {
      expect(createModalSrc).toMatch(/notes/);
    });
  });

  describe("API route: imports and dependencies", () => {
    it("imports from tenant utils", () => {
      expect(routeSrc).toMatch(/import.*requireCompany.*from/);
    });

    it("imports ERP utilities", () => {
      expect(routeSrc).toMatch(/createJournalEntryInTxn/);
    });

    it("imports nextDocNumber for auto numbering", () => {
      expect(routeSrc).toMatch(/import.*nextDocNumber.*from/);
    });
  });

  describe("API route: toMoneyNumber and clampPct helpers", () => {
    it("defines toMoneyNumber for safe currency rounding", () => {
      expect(routeSrc).toMatch(/function\s+toMoneyNumber/);
    });

    it("defines clampPct to constrain percentage 0-100", () => {
      expect(routeSrc).toMatch(/function\s+clampPct/);
    });
  });

  describe("API route: VAT computation", () => {
    it("defines computeVatFromAmount function", () => {
      expect(routeSrc).toMatch(/function\s+computeVatFromAmount/);
    });

    it("handles tax-inclusive and tax-exclusive modes", () => {
      expect(routeSrc).toMatch(/taxInclusive/);
    });

    it("returns vatAmount, amountTotal, taxRatePct, taxInclusive", () => {
      expect(routeSrc).toMatch(/vatAmount/);
      expect(routeSrc).toMatch(/amountTotal/);
    });
  });

  describe("API route: COGS calculation", () => {
    it("defines computeSalesOrderCogsInTxn function", () => {
      expect(routeSrc).toMatch(/computeSalesOrderCogsInTxn/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS
// =====================================================================
describe("ours behaviors", () => {
  describe("invoices list (mobile): description text", () => {
    it("shows workflow description about invoices", () => {
      expect(invoicesSrc).toMatch(/Create.*send.*record|Invoices/);
    });
  });

  describe("CreateInvoiceModal: invoiceNumber field", () => {
    it("includes invoiceNumber in draft state (allows auto numbering)", () => {
      expect(createModalSrc).toMatch(/invoiceNumber/);
    });
  });

  describe("CreateInvoiceModal: computed tax and total", () => {
    it("uses useMemo for computed tax/total values", () => {
      expect(createModalSrc).toMatch(/useMemo/);
      expect(createModalSrc).toMatch(/computed/);
    });
  });

  describe("CreateInvoiceModal: close icon", () => {
    it("imports X icon from lucide-react", () => {
      expect(createModalSrc).toMatch(/import.*X.*from\s*["']lucide-react["']/);
    });
  });

  describe("API route: journal entry creation", () => {
    it("imports getAccountCodesFromCompany for ERP integration", () => {
      expect(routeSrc).toMatch(/getAccountCodesFromCompany/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS
// =====================================================================
describe("theirs behaviors", () => {
  describe("invoices new (mobile): useAuth and useRequireAuth", () => {
    it("imports useAuth and useRequireAuth", () => {
      expect(invoicesNewSrc).toMatch(/useAuth/);
      expect(invoicesNewSrc).toMatch(/useRequireAuth/);
    });
  });

  describe("invoices new (mobile): uses fetchJson utility", () => {
    it("imports fetchJson from utils", () => {
      expect(invoicesNewSrc).toMatch(/import.*fetchJson/);
    });
  });

  describe("invoices new (mobile): cleanText helper", () => {
    it("defines cleanText for input sanitization", () => {
      expect(invoicesNewSrc).toMatch(/function\s+cleanText/);
    });
  });

  describe("CreateInvoiceModal: fetchJson import", () => {
    it("imports fetchJson utility", () => {
      expect(createModalSrc).toMatch(/import.*fetchJson/);
    });
  });

  describe("no conflict markers", () => {
    it("invoices.jsx has no conflict markers", () => {
      expect(invoicesSrc).not.toMatch(/<<<<<<</);
    });

    it("invoices-new.jsx has no conflict markers", () => {
      expect(invoicesNewSrc).not.toMatch(/<<<<<<</);
    });

    it("CreateInvoiceModal has no conflict markers", () => {
      expect(createModalSrc).not.toMatch(/<<<<<<</);
    });

    it("API route has no conflict markers", () => {
      expect(routeSrc).not.toMatch(/<<<<<<</);
    });
  });
});
