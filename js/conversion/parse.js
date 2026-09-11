.pragma library

// Deterministic recognizers. Every function here looks at the *whole*
// trimmed captured string (never a substring inside a longer sentence) and
// either returns a match descriptor or null. Matching the whole string is
// what keeps ordinary prose ("I'll see you at 5") from ever matching a unit
// pattern — there is no free-text scanning anywhere in this file.
//
// Nothing here converts or formats a value; that is convert.js/format.js's
// job. This file only decides *what the text is* and extracts the raw
// numbers/units out of it.

var NUM = "-?\\d+(?:\\.\\d+)?"
var UNUM = "\\d+(?:\\.\\d+)?"

function trimText(text) {
  return String(text === undefined || text === null ? "" : text).trim()
}

function toNumber(s) { return parseFloat(String(s).replace(/,/g, "")) }

// ---------------------------------------------------------------- temperature
function parseTemperature(text) {
  var m
  if ((m = new RegExp("^(" + NUM + ")\\s*°\\s*([CFK])$", "i").exec(text))) {
    return { category: "temperature", value: toNumber(m[1]), unit: m[2].toLowerCase(), confidence: "high" }
  }
  if ((m = new RegExp("^(" + NUM + ")\\s*degrees?\\s*(celsius|fahrenheit|kelvin)$", "i").exec(text))) {
    return { category: "temperature", value: toNumber(m[1]), unit: m[2][0].toLowerCase(), confidence: "high" }
  }
  if ((m = new RegExp("^(" + NUM + ")\\s*(celsius|fahrenheit|kelvin)$", "i").exec(text))) {
    return { category: "temperature", value: toNumber(m[1]), unit: m[2][0].toLowerCase(), confidence: "high" }
  }
  if ((m = new RegExp("^(" + NUM + ")\\s*°?([CFK])$").exec(text))) {
    return { category: "temperature", value: toNumber(m[1]), unit: m[2].toLowerCase(), confidence: "medium" }
  }
  return null
}

// --------------------------------------------------------------------- angle
function parseAngle(text) {
  var m
  if ((m = new RegExp("^(" + NUM + ")\\s*°$").exec(text))) {
    return { category: "angle", value: toNumber(m[1]), unit: "deg", confidence: "high" }
  }
  if ((m = new RegExp("^(" + NUM + ")\\s*deg(?:rees?)?$", "i").exec(text))) {
    return { category: "angle", value: toNumber(m[1]), unit: "deg", confidence: "high" }
  }
  if ((m = new RegExp("^(" + NUM + ")\\s*rad(?:ians?)?$", "i").exec(text))) {
    return { category: "angle", value: toNumber(m[1]), unit: "rad", confidence: "high" }
  }
  return null
}

// -------------------------------------------------------------------- length
function parseLengthCompound(text) {
  var m = new RegExp("^(" + UNUM + ")\\s*(?:'|ft|feet|foot)\\s*(" + UNUM + ")\\s*(?:\"|in|inch(?:es)?)?$", "i").exec(text)
  if (m) return { category: "lengthCompound", feet: toNumber(m[1]), inches: toNumber(m[2]), confidence: "high" }
  return null
}

function lengthUnitToken(word) {
  var w = word.toLowerCase()
  if (w === "mm" || w === "millimeter" || w === "millimeters" || w === "millimetre" || w === "millimetres") return "mm"
  if (w === "cm" || w === "centimeter" || w === "centimeters" || w === "centimetre" || w === "centimetres") return "cm"
  if (w === "m" || w === "meter" || w === "meters" || w === "metre" || w === "metres") return "m"
  if (w === "km" || w === "kilometer" || w === "kilometers" || w === "kilometre" || w === "kilometres") return "km"
  if (w === "in" || w === "\"" || w === "inch" || w === "inches") return "in"
  if (w === "ft" || w === "'" || w === "foot" || w === "feet") return "ft"
  if (w === "yd" || w === "yard" || w === "yards") return "yd"
  if (w === "mi" || w === "mile" || w === "miles") return "mi"
  return null
}

function parseLength(text) {
  var m = new RegExp("^(" + NUM + ")\\s*(mm|millimet(?:er|re)s?|cm|centimet(?:er|re)s?|km|kilomet(?:er|re)s?|m|meters?|metres?|in|inch(?:es)?|\"|ft|foot|feet|'|yd|yards?|mi|miles?)$", "i").exec(text)
  if (!m) return null
  var unit = lengthUnitToken(m[2])
  if (!unit) return null
  return { category: "length", value: toNumber(m[1]), unit: unit, confidence: "high" }
}

// ---------------------------------------------------------------------- area
function areaUnitToken(word) {
  var w = word.toLowerCase().replace(/\s+/g, "")
  if (w === "mm2" || w === "mm²") return "mm2"
  if (w === "cm2" || w === "cm²") return "cm2"
  if (w === "m2" || w === "m²") return "m2"
  if (w === "km2" || w === "km²") return "km2"
  if (w === "sqft" || w === "ft2" || w === "ft²") return "ft2"
  if (w === "sqyd" || w === "yd2" || w === "yd²") return "yd2"
  if (w === "acre" || w === "acres") return "acre"
  if (w === "hectare" || w === "hectares" || w === "ha") return "hectare"
  return null
}

function parseArea(text) {
  var m = new RegExp("^(" + NUM + ")\\s*(mm\\s*2|mm²|cm\\s*2|cm²|km\\s*2|km²|m\\s*2|m²|sq\\s*ft|ft\\s*2|ft²|sq\\s*yd|yd\\s*2|yd²|acres?|hectares?|ha)$", "i").exec(text)
  if (!m) return null
  var unit = areaUnitToken(m[2])
  if (!unit) return null
  return { category: "area", value: toNumber(m[1]), unit: unit, confidence: "high" }
}

// -------------------------------------------------------------------- volume
function parseVolume(text) {
  var m
  if ((m = new RegExp("^(" + NUM + ")\\s*(ml|millilit(?:er|re)s?)$", "i").exec(text)))
    return { category: "volume", value: toNumber(m[1]), unit: "ml", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(l|liters?|litres?)$", "i").exec(text)))
    return { category: "volume", value: toNumber(m[1]), unit: "l", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(fl(?:uid)?\\s*oz|fluid\\s*ounces?)\\s*(us|uk|imperial)?$", "i").exec(text))) {
    var region = (m[3] || "").toLowerCase()
    var unit = region === "uk" || region === "imperial" ? "flozUK" : "flozUS"
    return { category: "volume", value: toNumber(m[1]), unit: unit, confidence: "high" }
  }
  if ((m = new RegExp("^(" + NUM + ")\\s*cups?$", "i").exec(text)))
    return { category: "volume", value: toNumber(m[1]), unit: "cupUS", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*pints?\\s*(us|uk|imperial)?$", "i").exec(text))) {
    var pr = (m[2] || "").toLowerCase()
    return { category: "volume", value: toNumber(m[1]), unit: (pr === "uk" || pr === "imperial") ? "pintUK" : "pintUS", confidence: pr ? "high" : "medium", ambiguousRegion: !pr }
  }
  if ((m = new RegExp("^(" + NUM + ")\\s*quarts?\\s*(us|uk|imperial)?$", "i").exec(text))) {
    var qr = (m[2] || "").toLowerCase()
    return { category: "volume", value: toNumber(m[1]), unit: (qr === "uk" || qr === "imperial") ? "quartUK" : "quartUS", confidence: qr ? "high" : "medium", ambiguousRegion: !qr }
  }
  if ((m = new RegExp("^(" + NUM + ")\\s*(gal(?:lons?)?)\\s*(us|uk|imperial)?$", "i").exec(text))) {
    var gr = (m[3] || "").toLowerCase()
    return { category: "volume", value: toNumber(m[1]), unit: (gr === "uk" || gr === "imperial") ? "galUK" : "galUS", confidence: gr ? "high" : "medium", ambiguousRegion: !gr }
  }
  return null
}

// ---------------------------------------------------------------------- mass
function parseMass(text) {
  var m
  if ((m = new RegExp("^(" + NUM + ")\\s*(mg|milligrams?)$", "i").exec(text)))
    return { category: "mass", value: toNumber(m[1]), unit: "mg", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(g|grams?)$", "i").exec(text)))
    return { category: "mass", value: toNumber(m[1]), unit: "g", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(kg|kilograms?)$", "i").exec(text)))
    return { category: "mass", value: toNumber(m[1]), unit: "kg", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(lbs?|pounds?)$", "i").exec(text)))
    return { category: "mass", value: toNumber(m[1]), unit: "lb", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*stone$", "i").exec(text)))
    return { category: "mass", value: toNumber(m[1]), unit: "stone", confidence: "high" }
  return null
}

// Bare "oz"/"ounces" is genuinely ambiguous between mass and US fluid volume.
function parseMassOrVolumeAmbiguous(text) {
  var m = new RegExp("^(" + NUM + ")\\s*(oz|ounces?)$", "i").exec(text)
  if (!m) return null
  return { category: "massOrVolumeAmbiguous", value: toNumber(m[1]) }
}

// -------------------------------------------------------------------- speed
function parseSpeed(text) {
  var m
  if ((m = new RegExp("^(" + NUM + ")\\s*(km/?h|kph|kilomet(?:er|re)s?\\s*per\\s*hour)$", "i").exec(text)))
    return { category: "speed", value: toNumber(m[1]), unit: "kmh", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(mph|miles?\\s*per\\s*hour)$", "i").exec(text)))
    return { category: "speed", value: toNumber(m[1]), unit: "mph", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(knots?|kn|kt)$", "i").exec(text)))
    return { category: "speed", value: toNumber(m[1]), unit: "knot", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(m/s|mps|meters?\\s*per\\s*second)$", "i").exec(text)))
    return { category: "speed", value: toNumber(m[1]), unit: "mps", confidence: "high" }
  return null
}

// ----------------------------------------------------------------- pressure
function parsePressure(text) {
  var m
  if ((m = new RegExp("^(" + NUM + ")\\s*(kpa|kilopascals?)$", "i").exec(text)))
    return { category: "pressure", value: toNumber(m[1]), unit: "kpa", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(hpa|hectopascals?)$", "i").exec(text)))
    return { category: "pressure", value: toNumber(m[1]), unit: "hpa", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(pa|pascals?)$", "i").exec(text)))
    return { category: "pressure", value: toNumber(m[1]), unit: "pa", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(bar)$", "i").exec(text)))
    return { category: "pressure", value: toNumber(m[1]), unit: "bar", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(psi)$", "i").exec(text)))
    return { category: "pressure", value: toNumber(m[1]), unit: "psi", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(inhg|in\\.?\\s*hg)$", "i").exec(text)))
    return { category: "pressure", value: toNumber(m[1]), unit: "inhg", confidence: "high" }
  return null
}

// ------------------------------------------------------------ energy/power
function parseEnergyPower(text) {
  var m
  if ((m = new RegExp("^(" + NUM + ")\\s*(kwh|kilowatt-?hours?)$", "i").exec(text)))
    return { category: "energy", value: toNumber(m[1]), unit: "kwh", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(wh|watt-?hours?)$", "i").exec(text)))
    return { category: "energy", value: toNumber(m[1]), unit: "wh", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(kj|kilojoules?)$", "i").exec(text)))
    return { category: "energy", value: toNumber(m[1]), unit: "kj", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(j|joules?)$", "i").exec(text)))
    return { category: "energy", value: toNumber(m[1]), unit: "j", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(kw|kilowatts?)$", "i").exec(text)))
    return { category: "power", value: toNumber(m[1]), unit: "kw", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(w|watts?)$", "i").exec(text)))
    return { category: "power", value: toNumber(m[1]), unit: "w", confidence: "high" }
  return null
}

// ---------------------------------------------------------------- data size
function parseDataSize(text) {
  var m = new RegExp("^(" + NUM + ")\\s*(kib|mib|gib|tib|kb|mb|gb|tb|bytes?|b)$", "i").exec(text)
  if (!m) return null
  var unit = m[2].toLowerCase()
  if (unit === "bytes") unit = "b"
  return { category: "dataSize", value: toNumber(m[1]), unit: unit, confidence: "high" }
}

// ------------------------------------------------------------------ duration
function parseDuration(text) {
  var m
  if ((m = new RegExp("^(" + NUM + ")\\s*(s|sec|secs|seconds?)$", "i").exec(text)))
    return { category: "duration", value: toNumber(m[1]), unit: "s", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(min|mins|minutes?)$", "i").exec(text)))
    return { category: "duration", value: toNumber(m[1]), unit: "min", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(h|hr|hrs|hours?)$", "i").exec(text)))
    return { category: "duration", value: toNumber(m[1]), unit: "hour", confidence: "high" }
  if ((m = new RegExp("^(" + NUM + ")\\s*(d|days?)$", "i").exec(text)))
    return { category: "duration", value: toNumber(m[1]), unit: "day", confidence: "high" }
  if ((m = new RegExp("^(" + UNUM + ")\\s*h(?:ours?)?\\s*(" + UNUM + ")\\s*m(?:in(?:utes?)?)?$", "i").exec(text)))
    return { category: "duration", value: toNumber(m[1]) * 3600 + toNumber(m[2]) * 60, unit: "s", confidence: "high" }
  return null
}

// ----------------------------------------------------------------- timestamp
function parseTimestamp(text) {
  // Unix seconds: 10 digits, plausible 2001-09-09 .. 2286-11-20. Bare
  // integers of any other length are never treated as a timestamp — that is
  // the confidence check that keeps ordinary numbers from misfiring.
  if (/^\d{10}$/.test(text)) {
    return { category: "timestamp", value: parseInt(text, 10) * 1000, confidence: "medium" }
  }
  if (/^\d{13}$/.test(text)) {
    return { category: "timestamp", value: parseInt(text, 10), confidence: "medium" }
  }
  var iso = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(text)
  if (iso) {
    var isoText = text.indexOf(" ") !== -1 && !iso[7] ? text.replace(" ", "T") + "Z" : text.replace(" ", "T")
    var ms = Date.parse(isoText)
    if (!isNaN(ms)) return { category: "timestamp", value: ms, confidence: "high" }
  }
  var dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (dateOnly) {
    var d2 = Date.parse(text + "T00:00:00Z")
    if (!isNaN(d2)) return { category: "timestamp", value: d2, confidence: "high" }
  }
  return null
}

// --------------------------------------------------------------- timezone
var TZ_TIME_RE = /^(\d{1,2}):(\d{2})\s*(AM|PM)?\s*([A-Za-z]{2,5})$/i

function parseTimezoneTime(text) {
  var m = TZ_TIME_RE.exec(text)
  if (!m) return null
  var hour = parseInt(m[1], 10)
  var minute = parseInt(m[2], 10)
  var meridiem = m[3] ? m[3].toUpperCase() : null
  var abbr = m[4].toUpperCase()
  if (meridiem) {
    if (hour < 1 || hour > 12) return null
    if (meridiem === "PM" && hour !== 12) hour += 12
    if (meridiem === "AM" && hour === 12) hour = 0
  }
  if (hour > 23 || minute > 59) return null
  return { category: "timezoneTime", hour: hour, minute: minute, abbr: abbr }
}

// ----------------------------------------------------------------- fuel eco
function parseFuelEconomy(text) {
  var m
  if ((m = new RegExp("^(" + UNUM + ")\\s*l\\s*/\\s*100\\s*km$", "i").exec(text)))
    return { category: "fuelEconomy", value: toNumber(m[1]), unit: "l100km", confidence: "high" }
  if ((m = new RegExp("^(" + UNUM + ")\\s*km\\s*/\\s*l$", "i").exec(text)))
    return { category: "fuelEconomy", value: toNumber(m[1]), unit: "kml", confidence: "high" }
  if ((m = new RegExp("^(" + UNUM + ")\\s*mpg\\s*(us|uk|imperial)?$", "i").exec(text))) {
    var region = (m[2] || "").toLowerCase()
    var unit = region === "uk" || region === "imperial" ? "mpgUK" : "mpgUS"
    return { category: "fuelEconomy", value: toNumber(m[1]), unit: unit, confidence: region ? "high" : "medium", ambiguousRegion: !region }
  }
  return null
}

// ------------------------------------------------------------------- colour
function parseColorHex(text) {
  // The "#" is required: a bare 6-digit run of hex-looking characters (e.g.
  // "123456") is far more likely to be an ordinary number than a colour.
  var m = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.exec(text)
  if (!m) return null
  var hex = m[1]
  if (hex.length === 3) hex = hex.split("").map(function(c) { return c + c }).join("")
  return {
    category: "colorHex",
    r: parseInt(hex.substr(0, 2), 16),
    g: parseInt(hex.substr(2, 2), 16),
    b: parseInt(hex.substr(4, 2), 16),
    confidence: "high"
  }
}

function parseColorRgb(text) {
  var m = new RegExp("^rgba?\\(\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*(?:,\\s*[\\d.]+\\s*)?\\)$", "i").exec(text)
  if (!m) return null
  var r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10)
  if (r > 255 || g > 255 || b > 255) return null
  return { category: "colorRgb", r: r, g: g, b: b, confidence: "high" }
}

function parseColorHsl(text) {
  var m = new RegExp("^hsla?\\(\\s*(" + UNUM + ")\\s*,\\s*(" + UNUM + ")%\\s*,\\s*(" + UNUM + ")%\\s*(?:,\\s*[\\d.]+\\s*)?\\)$", "i").exec(text)
  if (!m) return null
  return { category: "colorHsl", h: toNumber(m[1]), s: toNumber(m[2]), l: toNumber(m[3]), confidence: "high" }
}

// ----------------------------------------------------------------- currency
var CURRENCY_SYMBOLS = {
  "$": { confident: null, candidates: ["USD", "CAD", "AUD", "NZD"] },
  "£": { confident: "GBP" },
  "€": { confident: "EUR" },
  "¥": { confident: null, candidates: ["JPY", "CNY"] },
  "₹": { confident: "INR" },
  "A$": { confident: "AUD" }, "C$": { confident: "CAD" }, "NZ$": { confident: "NZD" }
}

function parseCurrency(text) {
  var m = new RegExp("^([A-Za-z]{3})\\s*(" + UNUM.replace("\\d", "[\\d,]") + ")$").exec(text)
  if (m) return { category: "currency", value: toNumber(m[2]), currency: m[1].toUpperCase(), confidence: "high" }
  m = new RegExp("^(" + UNUM.replace("\\d", "[\\d,]") + ")\\s*([A-Za-z]{3})$").exec(text)
  if (m) return { category: "currency", value: toNumber(m[1]), currency: m[2].toUpperCase(), confidence: "high" }
  m = new RegExp("^(A\\$|C\\$|NZ\\$|[$£€¥₹])\\s*(" + UNUM.replace("\\d", "[\\d,]") + ")$").exec(text)
  if (m) {
    var info = CURRENCY_SYMBOLS[m[1]]
    if (!info) return null
    var value = toNumber(m[2])
    if (info.confident) return { category: "currency", value: value, currency: info.confident, confidence: "high" }
    return { category: "currencyAmbiguous", value: value, symbol: m[1], candidates: info.candidates }
  }
  return null
}

// -------------------------------------------------------------- compounds
function parseCompoundDimensions(text) {
  var unitAlt = "mm|cm|m|meters?|metres?|in|inch(?:es)?|ft|feet|foot|yd|yards?"
  var re = new RegExp("^(" + UNUM + ")\\s*(" + unitAlt + ")\\s*[x×]\\s*(" + UNUM + ")\\s*(" + unitAlt + ")?$", "i")
  var m = re.exec(text)
  if (!m) return null
  var unitA = lengthUnitToken(m[2])
  var unitB = m[4] ? lengthUnitToken(m[4]) : unitA
  if (!unitA || !unitB) return null
  return { category: "compoundDimensions", a: toNumber(m[1]), unitA: unitA, b: toNumber(m[3]), unitB: unitB }
}

function parseCompoundTransferTime(text) {
  var re = new RegExp("^(" + UNUM + ")\\s*(kib|mib|gib|tib|kb|mb|gb|tb)\\s*@\\s*(" + UNUM + ")\\s*(kb|mb|gb)/s$", "i")
  var m = re.exec(text)
  if (!m) return null
  return { category: "compoundTransferTime", size: toNumber(m[1]), sizeUnit: m[2].toLowerCase(), rate: toNumber(m[3]), rateUnit: m[4].toLowerCase() }
}

function parseCompoundCookTime(text) {
  var re = new RegExp("^(" + NUM + ")\\s*°?\\s*([CF])\\s+for\\s+(" + UNUM + ")\\s*(min(?:ute)?s?|h(?:ours?)?)$", "i")
  var m = re.exec(text)
  if (!m) return null
  return {
    category: "compoundCookTime",
    temperature: toNumber(m[1]), temperatureUnit: m[2].toLowerCase(),
    duration: toNumber(m[3]), durationUnit: /^h/i.test(m[4]) ? "hour" : "min"
  }
}

// ------------------------------------------------------------------- driver
// Ordered so that categories with a real risk of overlap are resolved by
// putting the more specific pattern first (e.g. compounds and colour/hex
// before plain numeric unit matches).
var MATCHERS = [
  parseCompoundCookTime, parseCompoundTransferTime, parseCompoundDimensions,
  parseColorHex, parseColorRgb, parseColorHsl,
  parseTimestamp, parseTimezoneTime,
  parseLengthCompound,
  parseTemperature, parseAngle,
  parseFuelEconomy,
  parseArea, parseVolume, parseMass, parseMassOrVolumeAmbiguous,
  parseSpeed, parsePressure, parseEnergyPower, parseDataSize, parseDuration,
  parseLength,
  parseCurrency
]

function recognize(rawText) {
  var text = trimText(rawText)
  if (!text || text.length > 120) return null
  for (var i = 0; i < MATCHERS.length; i++) {
    var result = MATCHERS[i](text)
    if (result) { result.raw = text; return result }
  }
  return null
}
