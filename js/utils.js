/* =========================================================
   ATTENDIFY PRO — Text Sanitization Utilities
   يمنع BOM وأي أحرف invisible من الوصول لـ fetch/localStorage
   ========================================================= */

/* eslint-disable no-control-regex */

// Invisible chars to strip (by charCode):
//   0xFEFF = BOM          0x200B = zero-width space
//   0x200C = ZWNJ         0x200D = ZWJ
//   0x00AD = soft hyphen  0x200E/F = LTR/RTL marks
var _INVISIBLE = [0xFEFF, 0x200B, 0x200C, 0x200D, 0x00AD, 0x200E, 0x200F];

/**
 * Remove BOM and invisible Unicode chars from a string.
 * Uses charCode comparison — no regex, no encoding issues.
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  var out = '', c;
  for (var i = 0; i < text.length; i++) {
    c = text.charCodeAt(i);
    if (_INVISIBLE.indexOf(c) === -1) out += text[i];
  }
  return out.trim();
}

/**
 * Sanitize an object recursively — cleans all string values.
 * Safe to use on parsed JSON objects.
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeText(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    var result = {};
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = sanitizeObject(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

/**
 * Safe JSON.parse that strips BOM from the raw string before parsing,
 * then sanitizes all string values in the result.
 */
function safeJsonParse(raw, fallback) {
  if (fallback === undefined) fallback = null;
  try {
    if (!raw) return fallback;
    var cleaned = sanitizeText(raw);
    var parsed = JSON.parse(cleaned);
    return sanitizeObject(parsed);
  } catch (e) {
    return fallback;
  }
}

/**
 * Safe localStorage.getItem that strips BOM from the returned value.
 */
function localGet(key) {
  try {
    return sanitizeText(localStorage.getItem(key));
  } catch (e) {
    return null;
  }
}

/**
 * Safe localStorage.setItem that strips BOM before storing.
 */
function localSet(key, value) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? sanitizeText(value) : value);
  } catch (e) {}
}

/**
 * Safe localStorage.getItem + JSON.parse combined.
 */
function localGetJson(key, fallback) {
  return safeJsonParse(localGet(key), fallback !== undefined ? fallback : null);
}

/**
 * Sanitize a URL — strips BOM and invisible chars, then encodes safely.
 */
function sanitizeUrl(url) {
  if (!url) return '';
  return sanitizeText(url);
}

/**
 * Wrap a FileReader result — strips BOM from text content.
 * Pass as the onload handler or call on reader.result.
 */
function sanitizeFileReaderResult(result) {
  if (typeof result !== 'string') return result;
  return sanitizeText(result);
}

/**
 * Parse CSV text that may start with BOM (common from Excel).
 * Returns array of rows (each row is array of cell strings).
 */
function parseCsvSafe(text) {
  var clean = sanitizeText(text);
  return clean.split('\n').map(function (row) {
    return row.split(',').map(function (cell) {
      return sanitizeText(cell.replace(/^["']|["']$/g, ''));
    });
  }).filter(function (row) {
    return row.some(function (c) { return c.length > 0; });
  });
}
