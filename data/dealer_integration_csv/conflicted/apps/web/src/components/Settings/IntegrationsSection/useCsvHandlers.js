import { toast } from "sonner";

// CSV uploads have been unreliable on some production domains when routed through
// Anything's generic upload service (it can return a 500 "Failed to upload image").
// For manual inventory import, we don't actually need to host the file — we can
// store the CSV text in the database (jsonb) and parse it server-side.
//
// This makes CSV import work consistently for real dealerships.

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read that file."));
      reader.onabort = () => reject(new Error("File read was cancelled."));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsText(file);
    } catch (e) {
      reject(e);
    }
  });
}

export function useCsvHandlers({
  customCsv, // currently unused but kept for compatibility
  csvUrlInput,
  setCsvUrlInput,
  importDaily,
  sftpHost,
  sftpPath,
  sftpUser,
  setError,
  upsertCustomCsv,
}) {
<<<<<<< ours

=======
  // No external upload; we store inline.
  const uploading = false;

>>>>>>> theirs
  const onUploadCsv = async (file) => {
    if (!file) return;

    setError(null);

    // Back-to-basics validation (fast, no file reads)
    if (typeof file.size === "number" && file.size <= 0) {
      const msg =
        "That file looks empty. Please re-export as CSV and try again.";
      setError(msg);
      toast.error("CSV upload failed", { description: msg });
      throw new Error(msg);
    }

    const name = String(file.name || "").toLowerCase();
    const mime = String(file.type || "").toLowerCase();

<<<<<<< ours
    // IMPORTANT: we only support real CSV files for manual inventory import.
=======

>>>>>>> theirs
    const isCsvByName = name.endsWith(".csv");
    const isCsvByMime =
<<<<<<< ours
      mime.includes("text/csv") ||
      mime.includes("application/csv") ||
      mime.includes("text/plain");

=======
      mime.includes("text/csv") ||
      mime.includes("application/csv") ||
      mime.includes("application/vnd.ms-excel") ||
      mime.includes("text/plain");

>>>>>>> theirs
    const looksLikeCsv = isCsvByName || isCsvByMime;

    if (!looksLikeCsv) {
      const msg =
        "That file doesn't look like a CSV (.csv). If you're uploading from Google Sheets, use File → Download → Comma Separated Values (.csv) and upload that file.";
      setError(msg);
      toast.error("CSV upload failed", { description: msg });
      throw new Error(msg);
    }

<<<<<<< ours
    // CRITICAL RELIABILITY FIX:
    // The Anything upload service (/_create/api/upload/) is optimized for images and has been
    // intermittently failing for CSVs in production (500: 'Failed to upload image.').
    // Instead of relying on that service, we store the CSV text directly in the DB.
=======
    // Read and store inline.
>>>>>>> theirs
    let inlineText = null;
    try {
<<<<<<< ours
      inlineText = await file.text();
=======
      inlineText = await readFileAsText(file);
>>>>>>> theirs
    } catch (e) {
<<<<<<< ours
      console.error("Could not read CSV file locally", e);
      const msg = "We couldn't read that file. Please try exporting again.";
      setError(msg);
      toast.error("CSV upload failed", { description: msg });
      throw new Error(msg);
    }
=======
      console.error("Failed reading CSV file", e);
      const msg = e?.message || "Could not read that CSV file.";
      setError(msg);
      toast.error("CSV upload failed", { description: msg });
      throw new Error(msg);
    }
>>>>>>> theirs

<<<<<<< ours
    const trimmed = String(inlineText || "").trim();
    if (!trimmed) {
      const msg = "That CSV file appears to be empty.";
      setError(msg);
      toast.error("CSV upload failed", { description: msg });
      throw new Error(msg);
=======
    if (!inlineText || !String(inlineText).trim()) {
      const msg = "That CSV file appears to be empty.";
      setError(msg);
      toast.error("CSV upload failed", { description: msg });
      throw new Error(msg);
>>>>>>> theirs
    }

<<<<<<< ours
    // Prevent huge payloads (keeps DB + API safe)
    if (trimmed.length > 4_000_000) {
      const msg =
        "That CSV is too large to upload this way. Please shorten it (or split into multiple files) and try again.";
      setError(msg);
      toast.error("CSV upload failed", { description: msg });
      throw new Error(msg);
=======
    // Safety: avoid storing extremely large CSV text in a single jsonb row.
    // Postgres row size is limited (~1.6MB). Keep some room for other fields.
    if (inlineText.length > 900_000) {
      const msg =
        "That CSV is too large to store via file upload in this app right now. Please paste a CSV URL instead (Google Sheets export link works), or split the file into smaller chunks.";
      setError(msg);
      toast.error("CSV upload failed", { description: msg });
      throw new Error(msg);
>>>>>>> theirs
    }

<<<<<<< ours
    // UI label only (we won't fetch this as a URL)
    const label = `inline://${file.name || "inventory.csv"}`;
    setCsvUrlInput(label);

=======
    // UI label only (we won't fetch this as a URL)
    setCsvUrlInput(`inline://${file.name || "inventory.csv"}`);

>>>>>>> theirs
    const cfg = {
<<<<<<< ours
      csvUrl: null,
      csvInlineText: trimmed,
=======
      csvUrl: null,
      csvInlineText: inlineText,
>>>>>>> theirs
      importFrequency: importDaily ? "daily" : "manual",
      sftp: {
        host: sftpHost || null,
        path: sftpPath || null,
        username: sftpUser || null,
      },
    };

    const id = await upsertCustomCsv(cfg);

    if (id) {
      toast.success("CSV saved", {
        description: "You can run a dry run or import now.",
      });
      return;
    }

    const msg =
<<<<<<< ours
      "CSV was read, but we could not save it to your dealership settings.";
=======
      "We read your CSV file, but could not save it to your dealership settings.";
>>>>>>> theirs
    setError(msg);
    toast.error("CSV upload failed", { description: msg });
    throw new Error(msg);
  };

  const onSaveCsvUrl = async () => {
    if (!csvUrlInput?.trim()) return;

    const trimmed = csvUrlInput.trim();
    if (trimmed.toLowerCase().startsWith("inline://")) {
      const msg =
        "That looks like an inline placeholder, not a real URL. Please upload the CSV again or paste a real CSV link.";
      setError(msg);
      toast.error("CSV URL save failed", { description: msg });
      return;
    }

    const cfg = {
      csvUrl: trimmed,
      csvInlineText: null,
      importFrequency: importDaily ? "daily" : "manual",
      sftp: {
        host: sftpHost || null,
        path: sftpPath || null,
        username: sftpUser || null,
      },
    };

    const id = await upsertCustomCsv(cfg);
    if (id) toast.success("CSV URL saved");
  };

  const onClearCsvUrl = async () => {
    try {
      setError(null);
      setCsvUrlInput("");

      const cfg = {
        csvUrl: null,
        csvInlineText: null,
        importFrequency: importDaily ? "daily" : "manual",
        sftp: {
          host: sftpHost || null,
          path: sftpPath || null,
          username: sftpUser || null,
        },
      };

      const id = await upsertCustomCsv(cfg);
      if (!id) {
        throw new Error("Could not clear the saved CSV.");
      }

      toast.success("CSV cleared");
    } catch (e) {
      console.error(e);
      const msg = e?.message || "Could not clear CSV";
      setError(msg);
      toast.error("Could not clear CSV", { description: msg });
    }
  };

  const onSaveSftp = async () => {
    const trimmed = String(csvUrlInput || "").trim();
    const isInline = trimmed.toLowerCase().startsWith("inline://");

    const cfg = {
      csvUrl: isInline ? null : trimmed || null,
      // IMPORTANT: do not wipe inline CSV just because user saves SFTP.
      csvInlineText:
        customCsv?.additional_config?.csvInlineText ||
        customCsv?.additional_config?.csv_inline_text ||
        null,
      importFrequency: importDaily ? "daily" : "manual",
      sftp: {
        host: sftpHost || null,
        path: sftpPath || null,
        username: sftpUser || null,
      },
    };

    const id = await upsertCustomCsv(cfg);
    if (id) toast.success("SFTP saved");
  };

  return {
    onUploadCsv,
    onSaveCsvUrl,
    onClearCsvUrl,
    onSaveSftp,
    uploading: false,
  };
}
