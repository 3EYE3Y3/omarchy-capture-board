import assert from "node:assert/strict"
import test from "node:test"
import { loadQmlJs } from "./load-qml-js.mjs"

const Convert = loadQmlJs(new URL("../js/conversion/convert.js", import.meta.url))

test("temperature: Celsius/Fahrenheit/Kelvin round trip, including negatives and decimals", () => {
  assert.equal(Convert.convertTemperature(0, "c", "f"), 32)
  assert.equal(Convert.convertTemperature(100, "c", "f"), 212)
  assert.equal(Math.round(Convert.convertTemperature(72, "f", "c") * 10) / 10, 22.2)
  assert.equal(Convert.convertTemperature(-40, "f", "c"), -40)
  assert.equal(Convert.convertTemperature(-40, "c", "f"), -40)
  assert.equal(Convert.convertTemperature(0, "c", "k"), 273.15)
  assert.equal(Convert.convertTemperature(-273.15, "c", "k"), 0)
  assert.equal(Math.round(Convert.convertTemperature(300, "k", "c") * 100) / 100, 26.85)
  assert.equal(Convert.convertTemperature(37.5, "c", "c"), 37.5)
})

test("length: metric and imperial factors", () => {
  assert.equal(Convert.convertLength(1, "km", "m"), 1000)
  assert.equal(Convert.convertLength(100, "cm", "m"), 1)
  assert.equal(Math.round(Convert.convertLength(1, "mi", "km") * 1000) / 1000, 1.609)
  assert.equal(Math.round(Convert.convertLength(1, "m", "ft") * 1000) / 1000, 3.281)
  assert.equal(Math.round(Convert.convertLength(12, "in", "ft") * 1e9) / 1e9, 1)
})

test("length: compound feet+inches conversion both ways", () => {
  const cm = Convert.feetInchesToCm(5, 11)
  assert.equal(Math.round(cm * 10) / 10, 180.3)
  const back = Convert.cmToFeetInches(180.34)
  assert.equal(back.feet, 5)
  assert.equal(Math.round(back.inches * 10) / 10, 11)
})

test("length: feet+inches rounding never reports 12.0 inches", () => {
  // 71.999999 inches should present as 6'0.0", not 5'12.0".
  const cm = 71.999999 * 2.54
  const result = Convert.cmToFeetInches(cm)
  assert.ok(result.inches < 12)
})

test("area: metric and imperial units", () => {
  assert.equal(Convert.convertArea(1, "km2", "m2"), 1000000)
  assert.equal(Convert.convertArea(10000, "m2", "hectare"), 1)
  assert.equal(Math.round(Convert.convertArea(1, "acre", "m2")), 4047)
  assert.equal(Math.round(Convert.convertArea(1, "m2", "ft2") * 1000) / 1000, 10.764)
})

test("volume: metric, US, and UK units are kept distinct", () => {
  assert.equal(Convert.convertVolume(1, "l", "ml"), 1000)
  assert.equal(Math.round(Convert.convertVolume(1, "galUS", "l") * 1000) / 1000, 3.785)
  assert.equal(Math.round(Convert.convertVolume(1, "galUK", "l") * 100) / 100, 4.55)
  assert.notEqual(Convert.convertVolume(1, "galUS", "l"), Convert.convertVolume(1, "galUK", "l"))
  assert.equal(Math.round(Convert.convertVolume(12, "flozUS", "ml")), 355)
})

test("mass: metric and imperial units", () => {
  assert.equal(Convert.convertMass(1, "kg", "g"), 1000)
  assert.equal(Math.round(Convert.convertMass(1, "lb", "g") * 100) / 100, 453.59)
  assert.equal(Math.round(Convert.convertMass(12, "oz", "g") * 10) / 10, 340.2)
  assert.equal(Math.round(Convert.convertMass(1, "stone", "lb") * 10) / 10, 14)
})

test("speed: mph, km/h, knots, m/s", () => {
  assert.equal(Math.round(Convert.convertSpeed(65, "mph", "kmh") * 10) / 10, 104.6)
  assert.equal(Math.round(Convert.convertSpeed(1, "knot", "kmh") * 1000) / 1000, 1.852)
  assert.equal(Convert.convertSpeed(10, "kmh", "mps"), 10 / 3.6)
})

test("pressure: Pa/kPa/hPa/bar/psi/inHg", () => {
  assert.equal(Convert.convertPressure(1, "bar", "kpa"), 100)
  assert.equal(Math.round(Convert.convertPressure(1, "psi", "kpa") * 1000) / 1000, 6.895)
  assert.equal(Convert.convertPressure(1000, "pa", "kpa"), 1)
  assert.equal(Math.round(Convert.convertPressure(1, "bar", "inhg") * 100) / 100, 29.53)
})

test("energy and power stay in separate dimensions", () => {
  assert.equal(Convert.convertEnergy(1, "kwh", "wh"), 1000)
  assert.equal(Convert.convertEnergy(1, "kj", "j"), 1000)
  assert.equal(Convert.convertPower(1, "kw", "w"), 1000)
  // 1 kWh is 3.6 MJ of energy, never confused with a power unit.
  assert.equal(Convert.convertEnergy(1, "kwh", "j"), 3600000)
})

test("data size: SI (decimal) and IEC (binary) families", () => {
  const bytes = Convert.convertDataBytes(2, "tb")
  assert.equal(bytes, 2e12)
  assert.equal(Math.round((Convert.bytesToUnit(bytes, "tib")) * 100) / 100, 1.82)
  assert.equal(Convert.convertDataBytes(1, "kib"), 1024)
  assert.equal(Convert.convertDataBytes(1, "kb"), 1000)
})

test("time/duration: seconds, minutes, hours, days", () => {
  assert.equal(Convert.convertTime(1, "hour", "min"), 60)
  assert.equal(Convert.convertTime(1, "day", "hour"), 24)
  assert.equal(Convert.convertTime(90, "min", "hour"), 1.5)
})

test("angle: degrees and radians", () => {
  assert.equal(Convert.convertAngle(180, "deg", "rad"), Math.PI)
  assert.equal(Math.round(Convert.convertAngle(Math.PI / 2, "rad", "deg")), 90)
})

test("fuel economy: L/100km, km/L, mpg US, mpg UK", () => {
  assert.equal(Math.round(Convert.convertFuelEconomy(15, "l100km", "kml") * 100) / 100, 6.67)
  assert.equal(Math.round(Convert.convertFuelEconomy(15, "l100km", "mpgUS") * 10) / 10, 15.7)
  assert.equal(Math.round(Convert.convertFuelEconomy(15, "l100km", "mpgUK") * 10) / 10, 18.8)
  assert.equal(Convert.convertFuelEconomy(0, "l100km", "mpgUS"), null)
})
