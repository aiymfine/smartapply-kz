/**
 * Document Parser Service
 * Extracts raw text from PDF and DOCX files
 */

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Parse a document buffer into raw text.
 * @param {Buffer} buffer - File buffer
 * @param {string} ext - File extension (e.g. '.pdf', '.docx')
 * @returns {Promise<string>} Extracted plain text
 */
async function parseDocument(buffer, ext) {
  switch (ext) {
    case '.pdf':
      return parsePdf(buffer);
    case '.docx':
    case '.doc':
      return parseDocx(buffer);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

/**
 * Extract text from PDF buffer
 */
async function parsePdf(buffer) {
  try {
    const result = await pdfParse(buffer);
    const text = result.text.trim();

    if (!text) {
      throw new Error('PDF appears to be empty or image-based (no extractable text).');
    }

    return text;
  } catch (err) {
    if (err.message.includes('empty')) throw err;
    throw new Error(`PDF parsing failed: ${err.message}`);
  }
}

/**
 * Extract text from DOCX buffer
 */
async function parseDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = result.value.trim();

    if (!text) {
      throw new Error('DOCX appears to be empty.');
    }

    return text;
  } catch (err) {
    throw new Error(`DOCX parsing failed: ${err.message}`);
  }
}

module.exports = { parseDocument };
