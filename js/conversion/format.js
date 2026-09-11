.pragma library

// Display formatting only: turns numbers/units into the strings shown in
// the Convert card. No parsing, no conversion math, no preferences lookup —
// callers decide precision and units; this just renders them consistently.

var UNIT_LABELS = {
  c: "°C", f: "°F", k: "K",
  mm: "mm", cm: "cm", m: "m", km: "km", in: "in", ft: "ft", yd: "yd", mi: "mi",
  mm2: "mm²", cm2: "cm²", m2: "m²", km2: "km²", ft2: "sq ft", yd2: "sq yd",
  acre: "acres", hectare: "ha",
  ml: "mL", l: "L",
  flozUS: "fl oz (US)", cupUS: "cups", pintUS: "pints (US)", quartUS: "quarts (US)", galUS: "gal (US)",
  flozUK: "fl oz (UK)", pintUK: "pints (UK)", quartUK: "quarts (UK)", galUK: "gal (UK)",
  mg: "mg", g: "g", kg: "kg", oz: "oz", lb: "lb", stone: "st",
  mps: "m/s", kmh: "km/h", mph: "mph", knot: "kn",
  pa: "Pa", kpa: "kPa", hpa: "hPa", bar: "bar", psi: "psi", inhg: "inHg",
  j: "J", kj: "kJ", wh: "Wh", kwh: "kWh", w: "W", kw: "kW",
  kb: "KB", mb: "MB", gb: "GB", tb: "TB", kib: "KiB", mib: "MiB", gib: "GiB", tib: "TiB", b: "bytes",
  s: "s", min: "min", hour: "h", day: "d",
  deg: "°", rad: "rad",
  l100km: "L/100km", kml: "km/L", mpgUS: "mpg (US)", mpgUK: "mpg (UK)"
}

// Fixed decimal precision per unit, chosen to match the values a person
// would actually type back in (never more precision than the input could
// have justified). Units not listed fall back to magnitudeDecimals().
var FIXED_DECIMALS = {
  c: 1, f: 1, k: 1,
  mm: 1, cm: 1, m: 2, km: 2, in: 1, ft: 1, yd: 2, mi: 2,
  ml: 0, l: 2,
  mg: 0, g: 1, kg: 2, oz: 1, lb: 2, stone: 2,
  mps: 1, kmh: 1, mph: 1, knot: 1,
  pa: 0, kpa: 1, hpa: 1, bar: 2, psi: 1, inhg: 2,
  j: 0, kj: 1, wh: 1, kwh: 2, w: 0, kw: 2,
  kb: 1, mb: 1, gb: 2, tb: 2, kib: 1, mib: 1, gib: 2, tib: 2,
  s: 0, min: 1, hour: 2, day: 2,
  deg: 1, rad: 3,
  l100km: 2, kml: 2, mpgUS: 1, mpgUK: 1
}

function roundTo(value, decimals) {
  var factor = Math.pow(10, decimals)
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function magnitudeDecimals(value) {
  var abs = Math.abs(value)
  if (abs === 0) return 2
  if (abs >= 100) return 0
  if (abs >= 10) return 1
  if (abs >= 1) return 2
  return 3
}

function decimalsForUnit(unit) {
  return Object.prototype.hasOwnProperty.call(FIXED_DECIMALS, unit) ? FIXED_DECIMALS[unit] : null
}

function formatNumber(value, decimals) {
  if (!isFinite(value)) return "—"
  var d = decimals === undefined || decimals === null ? magnitudeDecimals(value) : decimals
  var rounded = roundTo(value, d)
  // Avoid "-0.0".
  if (rounded === 0) rounded = 0
  return rounded.toFixed(d)
}

function unitLabel(unit) {
  return Object.prototype.hasOwnProperty.call(UNIT_LABELS, unit) ? UNIT_LABELS[unit] : unit
}

function formatValue(value, unit, decimalsOverride) {
  var decimals = decimalsOverride !== undefined && decimalsOverride !== null ? decimalsOverride : decimalsForUnit(unit)
  var label = unitLabel(unit)
  var noSpace = unit === "c" || unit === "f" || label.charAt(0) === "°"
  return formatNumber(value, decimals) + (noSpace ? "" : " ") + label
}

function formatFeetInches(feet, inches) {
  return feet + "' " + formatNumber(inches, 1) + '"'
}

function formatFeetInchesWords(feet, inches) {
  return feet + " ft " + formatNumber(inches, 1) + " in"
}

function formatDuration(totalSeconds) {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return "—"
  var seconds = Math.round(totalSeconds)
  var days = Math.floor(seconds / 86400); seconds -= days * 86400
  var hours = Math.floor(seconds / 3600); seconds -= hours * 3600
  var minutes = Math.floor(seconds / 60); seconds -= minutes * 60
  var parts = []
  if (days > 0) parts.push(days + "d")
  if (hours > 0) parts.push(hours + "h")
  if (minutes > 0) parts.push(minutes + "m")
  if (seconds > 0 || parts.length === 0) parts.push(seconds + "s")
  return parts.join(" ")
}

function pad2(n) { return (n < 10 ? "0" : "") + n }

var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// Renders a JS Date in *its own* getX()/getUTCX() fields — callers choose
// local or UTC beforehand by picking which getters the Date effectively
// uses. Deliberately hand-rolled instead of toLocaleString(): Qt's JS engine
// and Node disagree on Intl/ICU availability, so this stays identical on both.
function formatDateTime(date, timeFormat) {
  if (!date || isNaN(date.getTime())) return "—"
  var y = date.getFullYear(), mo = MONTH_NAMES[date.getMonth()], d = date.getDate()
  var h = date.getHours(), m = date.getMinutes(), s = date.getSeconds()
  var datePart = mo + " " + d + ", " + y
  var timePart
  if (timeFormat === "12h") {
    var period = h >= 12 ? "PM" : "AM"
    var h12 = h % 12; if (h12 === 0) h12 = 12
    timePart = h12 + ":" + pad2(m) + ":" + pad2(s) + " " + period
  } else {
    timePart = pad2(h) + ":" + pad2(m) + ":" + pad2(s)
  }
  return datePart + " " + timePart
}

function formatRgb(r, g, b) { return "RGB " + r + ", " + g + ", " + b }

function formatHsl(h, s, l) { return "HSL " + Math.round(h) + "°, " + Math.round(s) + "%, " + Math.round(l) + "%" }

function formatHex(r, g, b) {
  function hex2(n) { var s = Math.max(0, Math.min(255, Math.round(n))).toString(16); return s.length === 1 ? "0" + s : s }
  return "#" + hex2(r) + hex2(g) + hex2(b)
}
