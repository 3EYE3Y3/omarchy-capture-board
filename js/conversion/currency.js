.pragma library

// Pure currency math + cache-freshness rules. No network access lives here
// — ConversionService.qml fetches rates with curl and hands the resulting
// { base, rates, fetchedAt } object to convertAmount(). That keeps the only
// networked category in the engine just as testable as the offline ones.

var STALE_AFTER_MS = 24 * 60 * 60 * 1000

// rates: { base: "USD", rates: { "AUD": 1.53, "EUR": 0.92, ... }, fetchedAt: <ms epoch> }
function convertAmount(value, fromCurrency, toCurrency, rates) {
  if (!rates || !rates.rates) return null
  if (fromCurrency === toCurrency) return value
  var table = rates.rates
  var base = rates.base
  var fromRate = fromCurrency === base ? 1 : table[fromCurrency]
  var toRate = toCurrency === base ? 1 : table[toCurrency]
  if (fromRate === undefined || toRate === undefined) return null
  // value is in fromCurrency -> base -> toCurrency
  var inBase = value / fromRate
  return inBase * toRate
}

function ageMs(rates, now) {
  if (!rates || !rates.fetchedAt) return Infinity
  return (now === undefined ? Date.now() : now) - rates.fetchedAt
}

function isStale(rates, now) {
  return ageMs(rates, now) > STALE_AFTER_MS
}

function formatAge(ms) {
  if (!isFinite(ms)) return "unknown"
  var minutes = Math.round(ms / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return minutes + "m old"
  var hours = Math.round(minutes / 60)
  if (hours < 48) return hours + "h old"
  var days = Math.round(hours / 24)
  return days + "d old"
}

var SYMBOL_FOR = { USD: "$", CAD: "C$", AUD: "A$", NZD: "NZ$", GBP: "£", EUR: "€", JPY: "¥", CNY: "¥", INR: "₹" }

function symbolFor(currency) {
  return SYMBOL_FOR[currency] || (currency + " ")
}
