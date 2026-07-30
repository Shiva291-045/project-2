/**
 * Resume text extraction utility
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side fallback/authoritative extraction for uploaded resumes.
 * The frontend extracts PDF/TXT client-side for speed, but DOCX and any
 * PDF the client failed on are extracted here from the raw base64 payload.
 */

import mammoth from "mammoth";

// Lazy-load pdf-parse: it reads a bundled test file at import time in some
// versions, which we don't want triggered unless actually needed.
let _pdfParse = null;
const getPdfParse = async () => {
  if (!_pdfParse) {
    const mod = await import("pdf-parse");
    _pdfParse = mod.default || mod;
  }
  return _pdfParse;
};

const normalize = (text) =>
  (text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Extract text from a base64-encoded file buffer.
 * @param {string} base64
 * @param {string} mimeType
 * @param {string} fileName
 * @returns {Promise<{ text: string, method: string, error?: string }>}
 */
export const extractTextFromBase64 = async (base64, mimeType, fileName = "") => {
  if (!base64 || typeof base64 !== "string") {
    return { text: "", method: "none", error: "No file data provided." };
  }

  let buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch (e) {
    return { text: "", method: "none", error: "File data is not valid base64." };
  }

  if (!buffer.length) {
    return { text: "", method: "none", error: "Uploaded file is empty." };
  }

  const isDocx =
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.docx$/i.test(fileName);

  const isDoc =
    mimeType === "application/msword" ||
    (/\.doc$/i.test(fileName) && !isDocx);

  const isPdf = mimeType === "application/pdf" || /\.pdf$/i.test(fileName);

  const isTxt = mimeType === "text/plain" || /\.txt$/i.test(fileName);

  try {
    if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      return { text: normalize(result.value), method: "mammoth-docx" };
    }

    if (isPdf) {
      const pdfParse = await getPdfParse();
      const result = await pdfParse(buffer, { max: 15 });
      return { text: normalize(result.text), method: "pdf-parse" };
    }

    if (isTxt) {
      return { text: normalize(buffer.toString("utf-8")), method: "utf8-text" };
    }

    if (isDoc) {
      // Legacy binary .doc — mammoth/pdf-parse can't handle it reliably.
      return {
        text: "",
        method: "none",
        error: "Legacy .doc format is not supported. Please save as .docx or .pdf and re-upload.",
      };
    }

    return { text: "", method: "none", error: "Unsupported file type." };
  } catch (err) {
    console.error(`[TextExtraction] Failed for "${fileName}" (${mimeType}):`, err.message);
    return { text: "", method: "error", error: "Could not read this file. It may be corrupted or password-protected." };
  }
};
