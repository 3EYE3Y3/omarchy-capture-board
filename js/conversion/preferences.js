.pragma library

// Convert preferences: locale-derived defaults, merged with whatever the
// user has explicitly overridden (persisted by ConversionService.qml).
// Pure functions only — no file I/O, no QML types — so this is testable
// the same way as the rest of the engine.

var IMPERIAL_COUNTRY_CODES = { US: true, LR: true, MM: true }

var COUNTRY_CURRENCY = {
  US: "USD", GB: "GBP", AU: "AUD", CA: "CAD", NZ: "NZD", JP: "JPY", CN: "CNY",
  IN: "INR", CH: "CHF", SG: "SGD", HK: "HKD", ZA: "ZAR", MX: "MXN", BR: "BRL",
  DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", IE: "EUR", PT: "EUR",
  AT: "EUR", BE: "EUR", FI: "EUR", GR: "EUR"
}

var COUNTRY_MPG = { GB: "mpgUK", US: "mpgUS" }

function countryCodeFromLocale(localeName) {
  // localeName looks like "en_US" or "en-US"; the region is the part after
  // the separator, when present.
  var match = /[_-]([A-Za-z]{2})$/.exec(String(localeName || ""))
  return match ? match[1].toUpperCase() : ""
}

function defaultPreferences(localeName) {
  var country = countryCodeFromLocale(localeName)
  var imperial = !!IMPERIAL_COUNTRY_CODES[country]
  return {
    measurementSystem: imperial ? "imperial" : "metric",
    temperatureUnit: imperial ? "f" : "c",
    currency: COUNTRY_CURRENCY[country] || "USD",
    fuelEconomyUnit: COUNTRY_MPG[country] || "l100km",
    timeFormat: imperial ? "12h" : "24h",
    timezone: "",
    dataSizeUnit: "si"
  }
}

var VALID = {
  measurementSystem: { metric: true, imperial: true, custom: true },
  temperatureUnit: { c: true, f: true },
  fuelEconomyUnit: { l100km: true, kml: true, mpgUS: true, mpgUK: true },
  timeFormat: { "12h": true, "24h": true },
  dataSizeUnit: { si: true, iec: true, both: true }
}

// Merges stored overrides onto locale defaults, dropping anything
// unrecognized so a corrupt or future-schema settings file degrades to
// sane defaults instead of propagating garbage into the UI.
function resolvePreferences(localeName, stored) {
  var prefs = defaultPreferences(localeName)
  var overrides = stored && typeof stored === "object" ? stored : {}
  for (var key in prefs) {
    if (!(key in overrides)) continue
    var value = overrides[key]
    if (key === "currency") {
      if (typeof value === "string" && /^[A-Za-z]{3}$/.test(value)) prefs.currency = value.toUpperCase()
      continue
    }
    if (key === "timezone") {
      if (typeof value === "string") prefs.timezone = value
      continue
    }
    if (VALID[key] && Object.prototype.hasOwnProperty.call(VALID[key], value)) prefs[key] = value
  }
  return prefs
}

function lengthUnitFor(measurementSystem) { return measurementSystem === "imperial" ? "ft" : "m" }
function shortLengthUnitFor(measurementSystem) { return measurementSystem === "imperial" ? "in" : "cm" }
function massUnitFor(measurementSystem) { return measurementSystem === "imperial" ? "lb" : "kg" }
function speedUnitFor(measurementSystem) { return measurementSystem === "imperial" ? "mph" : "kmh" }
function volumeUnitFor(measurementSystem) { return measurementSystem === "imperial" ? "galUS" : "l" }
