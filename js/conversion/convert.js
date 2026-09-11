.pragma library
.import "units.js" as Units

// Pure conversion math. Every function here takes plain numbers/strings and
// returns plain numbers — no formatting, no locale, no preference lookups.
// format.js turns these numbers into display strings.

function linearConvert(value, fromUnit, toUnit, table) {
  var fromFactor = table[fromUnit]
  var toFactor = table[toUnit]
  if (fromFactor === undefined || toFactor === undefined) return null
  return (value * fromFactor) / toFactor
}

function celsiusToFahrenheit(c) { return c * 9 / 5 + 32 }
function fahrenheitToCelsius(f) { return (f - 32) * 5 / 9 }
function celsiusToKelvin(c) { return c + 273.15 }
function kelvinToCelsius(k) { return k - 273.15 }

function temperatureToCelsius(value, unit) {
  if (unit === "c") return value
  if (unit === "f") return fahrenheitToCelsius(value)
  if (unit === "k") return kelvinToCelsius(value)
  return null
}

function celsiusTo(value, unit) {
  if (unit === "c") return value
  if (unit === "f") return celsiusToFahrenheit(value)
  if (unit === "k") return celsiusToKelvin(value)
  return null
}

function convertTemperature(value, fromUnit, toUnit) {
  var celsius = temperatureToCelsius(value, fromUnit)
  if (celsius === null) return null
  return celsiusTo(celsius, toUnit)
}

function convertLength(value, fromUnit, toUnit) { return linearConvert(value, fromUnit, toUnit, Units.LENGTH) }
function convertArea(value, fromUnit, toUnit) { return linearConvert(value, fromUnit, toUnit, Units.AREA) }
function convertVolume(value, fromUnit, toUnit) { return linearConvert(value, fromUnit, toUnit, Units.VOLUME) }
function convertMass(value, fromUnit, toUnit) { return linearConvert(value, fromUnit, toUnit, Units.MASS) }
function convertSpeed(value, fromUnit, toUnit) { return linearConvert(value, fromUnit, toUnit, Units.SPEED) }
function convertPressure(value, fromUnit, toUnit) { return linearConvert(value, fromUnit, toUnit, Units.PRESSURE) }
function convertEnergy(value, fromUnit, toUnit) { return linearConvert(value, fromUnit, toUnit, Units.ENERGY) }
function convertPower(value, fromUnit, toUnit) { return linearConvert(value, fromUnit, toUnit, Units.POWER) }
function convertTime(value, fromUnit, toUnit) { return linearConvert(value, fromUnit, toUnit, Units.TIME) }
function convertAngle(value, fromUnit, toUnit) { return linearConvert(value, fromUnit, toUnit, Units.ANGLE) }

function convertDataBytes(value, fromUnit) {
  var bytes = Units.unitBytes(fromUnit)
  if (bytes === undefined) return null
  return value * bytes
}

function bytesToUnit(bytes, toUnit) {
  var factor = Units.unitBytes(toUnit)
  if (factor === undefined) return null
  return bytes / factor
}

// Feet+inches (a compound length) to centimetres, and back.
function feetInchesToCm(feet, inches) {
  return convertLength(feet, "ft", "cm") + convertLength(inches, "in", "cm")
}

function cmToFeetInches(cm) {
  var totalInches = convertLength(cm, "cm", "in")
  var feet = Math.floor(totalInches / 12)
  var inches = totalInches - feet * 12
  // Guard the 12.0-inch rounding edge (e.g. 71.999999in -> 5'12.0" instead
  // of 6'0.0") before it reaches display formatting.
  var roundedInches = Math.round(inches * 10) / 10
  if (roundedInches >= 12) { feet += 1; roundedInches -= 12 }
  return { feet: feet, inches: roundedInches }
}

// Fuel economy: convert everything through L/100km as the common base.
function fuelToL100km(value, unit) {
  if (unit === "l100km") return value
  if (unit === "kml") return value <= 0 ? null : 100 / value
  if (unit === "mpgUS") return value <= 0 ? null : 235.214583 / value
  if (unit === "mpgUK") return value <= 0 ? null : 282.480936 / value
  return null
}

function l100kmTo(l100km, unit) {
  if (unit === "l100km") return l100km
  if (l100km <= 0) return null
  if (unit === "kml") return 100 / l100km
  if (unit === "mpgUS") return 235.214583 / l100km
  if (unit === "mpgUK") return 282.480936 / l100km
  return null
}

function convertFuelEconomy(value, fromUnit, toUnit) {
  var base = fuelToL100km(value, fromUnit)
  if (base === null) return null
  return l100kmTo(base, toUnit)
}
