.pragma library
.import "parse.js" as Parse
.import "convert.js" as Convert
.import "format.js" as Format
.import "currency.js" as Currency
.import "units.js" as Units

// The single entry point the panel calls: analyze(text, prefs, options) ->
// null (nothing recognized/useful) or a ConversionResult:
//
//   { category, source, primary: {text, copyValue}, alternatives: [...],
//     ambiguous: false, swatch: {r,g,b}|undefined }
//
// or, when the captured text is genuinely ambiguous:
//
//   { category, source, ambiguous: true, options: [{ label, primary, alternatives }] }
//
// This is the only file that knows how parse.js categories map to
// convert.js calls and preference-driven target units — recognition,
// arithmetic, and display stay in their own modules.

function suggestion(text, copyValue) { return { text: text, copyValue: copyValue } }

function oppositeSystem(system) { return system === "imperial" ? "metric" : "imperial" }

function lengthInputSystem(unit) { return (unit === "in" || unit === "ft" || unit === "yd" || unit === "mi") ? "imperial" : "metric" }

function bestMetricLength(meters) {
  if (meters < 0.01) return { unit: "mm", value: Convert.convertLength(meters, "m", "mm") }
  if (meters < 3) return { unit: "cm", value: Convert.convertLength(meters, "m", "cm") }
  if (meters < 1000) return { unit: "m", value: meters }
  return { unit: "km", value: Convert.convertLength(meters, "m", "km") }
}

function bestImperialLength(meters) {
  var totalInches = Convert.convertLength(meters, "m", "in")
  if (totalInches < 12) return { unit: "in", value: totalInches }
  if (meters < 1609.344) {
    var fi = Convert.cmToFeetInches(meters * 100)
    return { compound: true, feet: fi.feet, inches: fi.inches }
  }
  return { unit: "mi", value: Convert.convertLength(meters, "m", "mi") }
}

function lengthTargetSystem(inputUnit, prefs) {
  var inputSystem = lengthInputSystem(inputUnit)
  return inputSystem === prefs.measurementSystem ? oppositeSystem(prefs.measurementSystem) : prefs.measurementSystem
}

function lengthTargetFor(meters, inputUnit, prefs) {
  var wantSystem = lengthTargetSystem(inputUnit, prefs)
  return wantSystem === "imperial" ? bestImperialLength(meters) : bestMetricLength(meters)
}

function renderLengthTarget(target) {
  if (target.compound) return suggestion(Format.formatFeetInchesWords(target.feet, target.inches), Format.formatFeetInches(target.feet, target.inches))
  return suggestion(Format.formatValue(target.value, target.unit), Format.formatValue(target.value, target.unit))
}

function analyzeLength(match, prefs) {
  var meters = Convert.convertLength(match.value, match.unit, "m")
  var targetSystem = lengthTargetSystem(match.unit, prefs)
  var target = targetSystem === "imperial" ? bestImperialLength(meters) : bestMetricLength(meters)
  var primary = renderLengthTarget(target)
  var otherSystem = oppositeSystem(targetSystem)
  var other = otherSystem === "imperial" ? bestImperialLength(meters) : bestMetricLength(meters)
  var alternatives = [renderLengthTarget(other)]
  return { category: "length", source: match.raw, primary: primary, alternatives: alternatives }
}

function analyzeLengthCompound(match, prefs) {
  var meters = Convert.feetInchesToCm(match.feet, match.inches) / 100
  var cmResult = Convert.convertLength(meters, "m", "cm")
  var primary = suggestion(Format.formatValue(cmResult, "cm"), Format.formatValue(cmResult, "cm"))
  var mResult = suggestion(Format.formatValue(meters, "m"), Format.formatValue(meters, "m"))
  return { category: "length", source: match.raw, primary: primary, alternatives: [mResult] }
}

function analyzeTemperature(match, prefs) {
  var preferred = prefs.temperatureUnit
  var alternate = preferred === "c" ? "f" : "c"
  var target = match.unit === preferred ? alternate : preferred
  var value = Convert.convertTemperature(match.value, match.unit, target)
  var primary = suggestion(Format.formatValue(value, target), Format.formatValue(value, target))
  var alternatives = []
  var third = "k"
  if (match.unit !== third && target !== third) {
    var kValue = Convert.convertTemperature(match.value, match.unit, third)
    alternatives.push(suggestion(Format.formatValue(kValue, third), Format.formatValue(kValue, third)))
  } else {
    var otherLetter = target === "c" ? "f" : "c"
    if (match.unit !== otherLetter) {
      var oValue = Convert.convertTemperature(match.value, match.unit, otherLetter)
      alternatives.push(suggestion(Format.formatValue(oValue, otherLetter), Format.formatValue(oValue, otherLetter)))
    }
  }
  return { category: "temperature", source: match.raw, primary: primary, alternatives: alternatives }
}

function analyzeAngle(match) {
  var target = match.unit === "deg" ? "rad" : "deg"
  var value = Convert.convertAngle(match.value, match.unit, target)
  return { category: "angle", source: match.raw, primary: suggestion(Format.formatValue(value, target), Format.formatValue(value, target)), alternatives: [] }
}

function areaInputSystem(unit) { return (unit === "ft2" || unit === "yd2" || unit === "acre") ? "imperial" : "metric" }

function analyzeArea(match, prefs) {
  var sqMeters = Convert.convertArea(match.value, match.unit, "m2")
  var inputSystem = areaInputSystem(match.unit)
  var wantSystem = inputSystem === prefs.measurementSystem ? oppositeSystem(prefs.measurementSystem) : prefs.measurementSystem
  var targetUnit = wantSystem === "imperial" ? "ft2" : "m2"
  var value = Convert.convertArea(sqMeters, "m2", targetUnit)
  var primary = suggestion(Format.formatValue(value, targetUnit), Format.formatValue(value, targetUnit))
  var alternatives = []
  if (sqMeters >= 2000) {
    var hectares = Convert.convertArea(sqMeters, "m2", "hectare")
    alternatives.push(suggestion(Format.formatValue(hectares, "hectare"), Format.formatValue(hectares, "hectare")))
  }
  return { category: "area", source: match.raw, primary: primary, alternatives: alternatives }
}

function volumeInputSystem(unit) {
  return (unit === "flozUK" || unit === "pintUK" || unit === "quartUK" || unit === "galUK" ||
    unit === "flozUS" || unit === "cupUS" || unit === "pintUS" || unit === "quartUS" || unit === "galUS") ? "imperial" : "metric"
}

function bestMetricVolume(liters) {
  if (liters < 1) return { unit: "ml", value: Convert.convertVolume(liters, "l", "ml") }
  return { unit: "l", value: liters }
}

function bestImperialVolume(liters) {
  if (liters < Units.VOLUME.cupUS) return { unit: "flozUS", value: Convert.convertVolume(liters, "l", "flozUS") }
  if (liters < Units.VOLUME.quartUS) return { unit: "cupUS", value: Convert.convertVolume(liters, "l", "cupUS") }
  if (liters < Units.VOLUME.galUS) return { unit: "quartUS", value: Convert.convertVolume(liters, "l", "quartUS") }
  return { unit: "galUS", value: Convert.convertVolume(liters, "l", "galUS") }
}

function analyzeVolume(match, prefs) {
  var liters = Convert.convertVolume(match.value, match.unit, "l")
  var inputSystem = volumeInputSystem(match.unit)
  var wantSystem = inputSystem === prefs.measurementSystem ? oppositeSystem(prefs.measurementSystem) : prefs.measurementSystem
  var target = wantSystem === "imperial" ? bestImperialVolume(liters) : bestMetricVolume(liters)
  var primary = suggestion(Format.formatValue(target.value, target.unit), Format.formatValue(target.value, target.unit))
  return { category: "volume", source: match.raw, primary: primary, alternatives: [] }
}

function massInputSystem(unit) { return (unit === "oz" || unit === "lb" || unit === "stone") ? "imperial" : "metric" }

function bestMetricMass(grams) {
  if (grams < 1000) return { unit: "g", value: grams }
  return { unit: "kg", value: Convert.convertMass(grams, "g", "kg") }
}

function bestImperialMass(grams) {
  var oz = Convert.convertMass(grams, "g", "oz")
  if (oz < 16) return { unit: "oz", value: oz }
  return { unit: "lb", value: Convert.convertMass(grams, "g", "lb") }
}

function analyzeMass(match, prefs) {
  var grams = Convert.convertMass(match.value, match.unit, "g")
  var inputSystem = massInputSystem(match.unit)
  var wantSystem = inputSystem === prefs.measurementSystem ? oppositeSystem(prefs.measurementSystem) : prefs.measurementSystem
  var target = wantSystem === "imperial" ? bestImperialMass(grams) : bestMetricMass(grams)
  var primary = suggestion(Format.formatValue(target.value, target.unit), Format.formatValue(target.value, target.unit))
  return { category: "mass", source: match.raw, primary: primary, alternatives: [] }
}

function analyzeMassOrVolumeAmbiguous(match, prefs) {
  var massResult = analyzeMass({ value: match.value, unit: "oz", raw: match.value + " oz" }, prefs)
  var volumeResult = analyzeVolume({ value: match.value, unit: "flozUS", raw: match.value + " fl oz" }, prefs)
  return {
    category: "massOrVolumeAmbiguous",
    source: match.value + " oz",
    ambiguous: true,
    options: [
      { label: "Mass", primary: massResult.primary, alternatives: massResult.alternatives },
      { label: "Fluid (US)", primary: volumeResult.primary, alternatives: volumeResult.alternatives }
    ]
  }
}

function analyzeSpeed(match, prefs) {
  var mps = Convert.convertSpeed(match.value, match.unit, "mps")
  var metricUnit = "kmh", imperialUnit = "mph"
  var inputSystem = match.unit === "mph" ? "imperial" : "metric"
  var wantSystem = inputSystem === prefs.measurementSystem ? oppositeSystem(prefs.measurementSystem) : prefs.measurementSystem
  var targetUnit = wantSystem === "imperial" ? imperialUnit : metricUnit
  var value = Convert.convertSpeed(mps, "mps", targetUnit)
  var primary = suggestion(Format.formatValue(value, targetUnit), Format.formatValue(value, targetUnit))
  var alternatives = []
  if (match.unit !== "knot" && targetUnit !== "knot") {
    var knots = Convert.convertSpeed(mps, "mps", "knot")
    alternatives.push(suggestion(Format.formatValue(knots, "knot"), Format.formatValue(knots, "knot")))
  }
  return { category: "speed", source: match.raw, primary: primary, alternatives: alternatives }
}

function analyzePressure(match, prefs) {
  var targetUnit = prefs.measurementSystem === "imperial" ? "psi" : "kpa"
  if (match.unit === targetUnit) targetUnit = prefs.measurementSystem === "imperial" ? "inhg" : "bar"
  var value = Convert.convertPressure(match.value, match.unit, targetUnit)
  return { category: "pressure", source: match.raw, primary: suggestion(Format.formatValue(value, targetUnit), Format.formatValue(value, targetUnit)), alternatives: [] }
}

function analyzeEnergy(match) {
  var targetUnit = (match.unit === "j" || match.unit === "kj") ? "wh" : "kj"
  var value = Convert.convertEnergy(match.value, match.unit, targetUnit)
  return { category: "energy", source: match.raw, primary: suggestion(Format.formatValue(value, targetUnit), Format.formatValue(value, targetUnit)), alternatives: [] }
}

function analyzePower(match) {
  var targetUnit = match.unit === "w" ? "kw" : "w"
  var value = Convert.convertPower(match.value, match.unit, targetUnit)
  return { category: "power", source: match.raw, primary: suggestion(Format.formatValue(value, targetUnit), Format.formatValue(value, targetUnit)), alternatives: [] }
}

function bestSiData(bytes) {
  if (bytes >= 1e12) return { unit: "tb", value: bytes / 1e12 }
  if (bytes >= 1e9) return { unit: "gb", value: bytes / 1e9 }
  if (bytes >= 1e6) return { unit: "mb", value: bytes / 1e6 }
  if (bytes >= 1e3) return { unit: "kb", value: bytes / 1e3 }
  return { unit: "b", value: bytes }
}

function bestIecData(bytes) {
  if (bytes >= 1024 ** 4) return { unit: "tib", value: bytes / 1024 ** 4 }
  if (bytes >= 1024 ** 3) return { unit: "gib", value: bytes / 1024 ** 3 }
  if (bytes >= 1024 ** 2) return { unit: "mib", value: bytes / 1024 ** 2 }
  if (bytes >= 1024) return { unit: "kib", value: bytes / 1024 }
  return { unit: "b", value: bytes }
}

function analyzeDataSize(match, prefs) {
  var bytes = Convert.convertDataBytes(match.value, match.unit)
  var inputFamily = Units.isIecDataUnit(match.unit) ? "iec" : "si"
  var pref = prefs.dataSizeUnit
  var primaryFamily
  if (pref === "both") primaryFamily = inputFamily === "si" ? "iec" : "si"
  else primaryFamily = inputFamily === pref ? (pref === "si" ? "iec" : "si") : pref
  var primaryTarget = primaryFamily === "iec" ? bestIecData(bytes) : bestSiData(bytes)
  var primary = suggestion(Format.formatValue(primaryTarget.value, primaryTarget.unit), Format.formatValue(primaryTarget.value, primaryTarget.unit))
  var alternatives = []
  if (pref === "both") {
    var otherTarget = primaryFamily === "iec" ? bestSiData(bytes) : bestIecData(bytes)
    alternatives.push(suggestion(Format.formatValue(otherTarget.value, otherTarget.unit), Format.formatValue(otherTarget.value, otherTarget.unit)))
  }
  return { category: "dataSize", source: match.raw, primary: primary, alternatives: alternatives }
}

function bestDurationUnit(seconds) {
  if (seconds < 60) return "s"
  if (seconds < 3600) return "min"
  if (seconds < 86400) return "hour"
  return "day"
}

function analyzeDuration(match) {
  var seconds = Convert.convertTime(match.value, match.unit, "s")
  var targetUnit = bestDurationUnit(seconds)
  if (targetUnit === match.unit) {
    var order = ["s", "min", "hour", "day"]
    var idx = order.indexOf(match.unit)
    targetUnit = order[idx === 0 ? 1 : idx - 1]
  }
  var value = Convert.convertTime(seconds, "s", targetUnit)
  return { category: "duration", source: match.raw, primary: suggestion(Format.formatValue(value, targetUnit), Format.formatValue(value, targetUnit)), alternatives: [] }
}

function analyzeTimestamp(match, prefs) {
  var date = new Date(match.value)
  var local = Format.formatDateTime(date, prefs.timeFormat)
  var iso = date.toISOString()
  var unixSeconds = Math.round(match.value / 1000)
  return {
    category: "timestamp",
    source: match.raw,
    primary: suggestion(local, local),
    alternatives: [suggestion(iso, iso), suggestion(String(unixSeconds) + " (unix seconds)", String(unixSeconds))]
  }
}

function analyzeTimezoneTime(match, prefs) {
  var offset = Units.TZ_OFFSET_MINUTES[match.abbr]
  var ambiguous = Units.TZ_AMBIGUOUS[match.abbr]
  if (ambiguous) {
    return { category: "timezoneTime", source: match.hour + ":" + (match.minute < 10 ? "0" : "") + match.minute + " " + match.abbr, ambiguous: true, options: ambiguous.map(function(label) { return { label: label, primary: null, alternatives: [] } }) }
  }
  if (offset === undefined) return null
  var now = new Date()
  var utcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), match.hour, match.minute, 0) - offset * 60000
  var local = Format.formatDateTime(new Date(utcMs), prefs.timeFormat)
  return { category: "timezoneTime", source: match.raw, primary: suggestion(local + " local", local), alternatives: [] }
}

function analyzeFuelEconomy(match, prefs) {
  var order = ["l100km", "kml", "mpgUS", "mpgUK"]
  var l100km = Convert.fuelToL100km(match.value, match.unit)
  if (l100km === null) return null
  var remaining = order.filter(function(u) { return u !== match.unit })
  var preferredFirst = remaining.indexOf(prefs.fuelEconomyUnit) !== -1
    ? [prefs.fuelEconomyUnit].concat(remaining.filter(function(u) { return u !== prefs.fuelEconomyUnit }))
    : remaining
  var results = preferredFirst.map(function(unit) {
    var value = Convert.l100kmTo(l100km, unit)
    return suggestion(Format.formatValue(value, unit), Format.formatValue(value, unit))
  })
  return { category: "fuelEconomy", source: match.raw, primary: results[0], alternatives: results.slice(1) }
}

function analyzeColorHex(match) {
  var rgb = Format.formatRgb(match.r, match.g, match.b)
  var hsl = rgbToHsl(match.r, match.g, match.b)
  return {
    category: "color", source: match.raw,
    swatch: { r: match.r, g: match.g, b: match.b },
    primary: suggestion(rgb, rgb),
    alternatives: [suggestion(Format.formatHsl(hsl.h, hsl.s, hsl.l), Format.formatHsl(hsl.h, hsl.s, hsl.l))]
  }
}

function analyzeColorRgb(match) {
  var hex = Format.formatHex(match.r, match.g, match.b)
  var hsl = rgbToHsl(match.r, match.g, match.b)
  return {
    category: "color", source: match.raw,
    swatch: { r: match.r, g: match.g, b: match.b },
    primary: suggestion(hex, hex),
    alternatives: [suggestion(Format.formatHsl(hsl.h, hsl.s, hsl.l), Format.formatHsl(hsl.h, hsl.s, hsl.l))]
  }
}

function analyzeColorHsl(match) {
  var rgb = hslToRgb(match.h, match.s, match.l)
  var hex = Format.formatHex(rgb.r, rgb.g, rgb.b)
  var rgbText = Format.formatRgb(rgb.r, rgb.g, rgb.b)
  return {
    category: "color", source: match.raw,
    swatch: { r: rgb.r, g: rgb.g, b: rgb.b },
    primary: suggestion(hex, hex),
    alternatives: [suggestion(rgbText, rgbText)]
  }
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  var max = Math.max(r, g, b), min = Math.min(r, g, b)
  var h = 0, s = 0, l = (max + min) / 2
  var d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h: h, s: s * 100, l: l * 100 }
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100
  var c = (1 - Math.abs(2 * l - 1)) * s
  var x = c * (1 - Math.abs((h / 60) % 2 - 1))
  var m = l - c / 2
  var r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

function analyzeCurrency(match, prefs, options) {
  var rates = options && options.rates
  if (!rates || !rates.rates) {
    return { category: "currency", source: match.raw, unavailable: true, primary: null, alternatives: [], note: "Currency rates unavailable — connect once to fetch them." }
  }
  var target = prefs.currency
  if (target === match.currency) return null
  var converted = Currency.convertAmount(match.value, match.currency, target, rates)
  if (converted === null) {
    return { category: "currency", source: match.raw, unavailable: true, primary: null, alternatives: [], note: "No cached rate for " + match.currency + " → " + target + "." }
  }
  var text = Currency.symbolFor(target) + Format.formatNumber(converted, 2) + " " + target
  var stale = Currency.isStale(rates, options.now)
  var note = stale
    ? "Cached rate · " + Currency.formatAge(Currency.ageMs(rates, options.now))
    : "Updated " + Format.formatDateTime(new Date(rates.fetchedAt), prefs.timeFormat)
  return { category: "currency", source: match.raw, primary: suggestion(text, Format.formatNumber(converted, 2) + " " + target), alternatives: [], note: note, stale: stale }
}

function analyzeCurrencyAmbiguous(match, prefs, options) {
  var options_ = match.candidates.map(function(currency) {
    if (currency === prefs.currency) {
      var text = Currency.symbolFor(currency) + Format.formatNumber(match.value, 2) + " " + currency
      return { label: currency, primary: suggestion(text, Format.formatNumber(match.value, 2) + " " + currency), alternatives: [], note: "Already " + currency, unavailable: false }
    }
    var result = analyzeCurrency({ value: match.value, currency: currency, raw: match.symbol + match.value }, prefs, options)
    return { label: currency, primary: result ? result.primary : null, alternatives: result ? result.alternatives : [], note: result ? result.note : undefined, unavailable: result ? result.unavailable : true }
  })
  return { category: "currencyAmbiguous", source: match.symbol + match.value, ambiguous: true, options: options_ }
}

function analyzeCompoundDimensions(match, prefs) {
  var targetUnit = prefs.measurementSystem === "imperial" ? "ft" : "m"
  var a = Convert.convertLength(match.a, match.unitA, targetUnit)
  var b = Convert.convertLength(match.b, match.unitB, targetUnit)
  var areaUnit = targetUnit === "ft" ? "ft2" : "m2"
  var area = a * b
  var text = Format.formatValue(a, targetUnit) + " × " + Format.formatValue(b, targetUnit)
  var areaText = Format.formatValue(area, areaUnit)
  return {
    category: "compoundDimensions", source: match.a + " " + match.unitA + " × " + match.b + " " + (match.unitB || match.unitA),
    primary: suggestion(text, text),
    alternatives: [suggestion(areaText, areaText)]
  }
}

function analyzeCompoundTransferTime(match) {
  var bytes = Convert.convertDataBytes(match.size, match.sizeUnit)
  var rateBytesPerSecond = Convert.convertDataBytes(match.rate, match.rateUnit)
  if (!rateBytesPerSecond) return null
  var seconds = bytes / rateBytesPerSecond
  var text = "approximately " + Format.formatDuration(seconds)
  return { category: "compoundTransferTime", source: match.size + match.sizeUnit + " @ " + match.rate + match.rateUnit + "/s", primary: suggestion(text, Format.formatDuration(seconds)), alternatives: [] }
}

function analyzeCompoundCookTime(match, prefs) {
  var targetUnit = prefs.temperatureUnit
  var tempValue = Convert.convertTemperature(match.temperature, match.temperatureUnit, targetUnit)
  var tempText = Format.formatValue(tempValue, targetUnit, 0)
  var durationText = match.duration + " " + (match.durationUnit === "hour" ? "h" : "min")
  var text = tempText + " · " + durationText
  return { category: "compoundCookTime", source: match.temperature + "°" + match.temperatureUnit.toUpperCase() + " for " + match.duration + " " + match.durationUnit, primary: suggestion(text, text), alternatives: [] }
}

function analyze(text, prefs, options) {
  var match = Parse.recognize(text)
  if (!match) return null
  var opts = options || {}
  switch (match.category) {
    case "temperature": return analyzeTemperature(match, prefs)
    case "angle": return analyzeAngle(match)
    case "length": return analyzeLength(match, prefs)
    case "lengthCompound": return analyzeLengthCompound(match, prefs)
    case "area": return analyzeArea(match, prefs)
    case "volume": return analyzeVolume(match, prefs)
    case "mass": return analyzeMass(match, prefs)
    case "massOrVolumeAmbiguous": return analyzeMassOrVolumeAmbiguous(match, prefs)
    case "speed": return analyzeSpeed(match, prefs)
    case "pressure": return analyzePressure(match, prefs)
    case "energy": return analyzeEnergy(match)
    case "power": return analyzePower(match)
    case "dataSize": return analyzeDataSize(match, prefs)
    case "duration": return analyzeDuration(match)
    case "timestamp": return analyzeTimestamp(match, prefs)
    case "timezoneTime": return analyzeTimezoneTime(match, prefs)
    case "fuelEconomy": return analyzeFuelEconomy(match, prefs)
    case "colorHex": return analyzeColorHex(match)
    case "colorRgb": return analyzeColorRgb(match)
    case "colorHsl": return analyzeColorHsl(match)
    case "currency": return analyzeCurrency(match, prefs, opts)
    case "currencyAmbiguous": return analyzeCurrencyAmbiguous(match, prefs, opts)
    case "compoundDimensions": return analyzeCompoundDimensions(match, prefs)
    case "compoundTransferTime": return analyzeCompoundTransferTime(match)
    case "compoundCookTime": return analyzeCompoundCookTime(match, prefs)
    default: return null
  }
}
