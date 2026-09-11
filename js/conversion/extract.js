.pragma library
.import "parse.js" as Parse

// Finds convertible values embedded in a longer block of text — OCR output
// above all, which is mostly surrounding words and layout noise around a
// handful of actual values. This never invents its own recognition rules:
// it only proposes candidate substrings (sliding windows of whitespace
// tokens) and keeps the ones parse.recognize() — the exact same,
// unmodified matcher used for a single pasted value — would already accept
// on its own. That is what keeps this resistant to false positives on
// dates, phone numbers, IDs, version numbers, and ordinary prose: nothing
// here is more permissive than the single-value path already tested by
// parse.test.mjs.

var MAX_WINDOW_TOKENS = 6

function tokenize(text) {
  var tokens = []
  var re = /\S+/g
  var m
  while ((m = re.exec(text)) !== null) tokens.push(m[0])
  return tokens
}

// Trims sentence/list punctuation a value can end up glued to in prose or
// OCR output ("...around 15 mph.", "72°F,") without touching characters
// several matchers rely on (', ", %, $, °, /) that happen to also be
// punctuation-adjacent.
function stripEdgePunctuation(candidate) {
  return candidate.replace(/^[([{]+/, "").replace(/[)\]}.,;:!?]+$/, "")
}

// Timestamp matches that are too weak a signal once a value is found
// *inside* surrounding text rather than being the entire captured string:
//   - a bare digit run (10 or 13 digits) is far more likely to be a phone
//     number, an order ID, or a serial number than a pasted unix time
//   - a bare calendar date ("2024-01-15") is far more likely to just be a
//     date mentioned in passing ("shipped on 2024-01-15") than a value the
//     user wants converted
// A full ISO-8601 timestamp with a time component is a strong enough,
// deliberate-looking signal to keep. The single-value clipboard path
// (analyze()) is entirely unaffected — this rule only applies to values
// found while scanning surrounding text.
function isLowConfidenceForExtraction(match, candidate) {
  if (match.category !== "timestamp") return false
  return /^\d+$/.test(candidate) || /^\d{4}-\d{2}-\d{2}$/.test(candidate)
}

// A window normally only needs to start at a digit-bearing token ("149",
// "72°F"). A currency code or symbol sitting *before* the number ("USD
// 149", "$100") has no digit of its own, so it needs its own start
// condition or a prefix form like "USD 149" would never be tried.
var CURRENCY_LEAD_RE = /^[([{]*(?:[A-Za-z]{3}|A\$|C\$|NZ\$|[$£€¥₹])[)\]},.;:!?]*$/

function looksLikeCandidateStart(token) {
  return /\d/.test(token) || CURRENCY_LEAD_RE.test(token)
}

function extractCandidates(text, maxResults) {
  var limit = maxResults || 24
  var tokens = tokenize(String(text === undefined || text === null ? "" : text))
  var results = []
  var i = 0

  while (i < tokens.length && results.length < limit) {
    if (!looksLikeCandidateStart(tokens[i])) { i++; continue }

    var matched = null
    var consumed = 1
    var maxLen = Math.min(MAX_WINDOW_TOKENS, tokens.length - i)

    for (var len = maxLen; len >= 1; len--) {
      var candidate = stripEdgePunctuation(tokens.slice(i, i + len).join(" "))
      var match = candidate ? Parse.recognize(candidate) : null
      if (match && isLowConfidenceForExtraction(match, candidate)) match = null
      if (match) { matched = match; consumed = len; break }
    }

    if (matched) {
      results.push(matched)
      i += consumed
    } else {
      i += 1
    }
  }

  return results
}
