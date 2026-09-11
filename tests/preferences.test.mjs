import assert from "node:assert/strict"
import test from "node:test"
import { loadQmlJs } from "./load-qml-js.mjs"

const Prefs = loadQmlJs(new URL("../js/conversion/preferences.js", import.meta.url))

test("locale-derived defaults: US gets imperial, most others get metric", () => {
  assert.equal(Prefs.defaultPreferences("en_US").measurementSystem, "imperial")
  assert.equal(Prefs.defaultPreferences("en_US").temperatureUnit, "f")
  assert.equal(Prefs.defaultPreferences("en_AU").measurementSystem, "metric")
  assert.equal(Prefs.defaultPreferences("en_AU").temperatureUnit, "c")
  assert.equal(Prefs.defaultPreferences("en_GB").fuelEconomyUnit, "mpgUK")
})

test("locale-derived default currency follows country", () => {
  assert.equal(Prefs.defaultPreferences("en_AU").currency, "AUD")
  assert.equal(Prefs.defaultPreferences("de_DE").currency, "EUR")
  assert.equal(Prefs.defaultPreferences("ja_JP").currency, "JPY")
  assert.equal(Prefs.defaultPreferences("xx_ZZ").currency, "USD") // unknown region falls back sanely
})

test("stored overrides win over locale defaults", () => {
  const resolved = Prefs.resolvePreferences("en_US", { measurementSystem: "metric", currency: "eur" })
  assert.equal(resolved.measurementSystem, "metric")
  assert.equal(resolved.currency, "EUR")
  assert.equal(resolved.temperatureUnit, "f") // untouched fields keep their locale default
})

test("invalid or corrupt stored values are dropped, not propagated", () => {
  const resolved = Prefs.resolvePreferences("en_AU", { measurementSystem: "banana", currency: "1234", timeFormat: "30h" })
  assert.equal(resolved.measurementSystem, "metric")
  assert.equal(resolved.currency, "AUD")
  assert.equal(resolved.timeFormat, "24h")
})

test("resolvePreferences tolerates missing/null stored settings", () => {
  assert.doesNotThrow(() => Prefs.resolvePreferences("en_US", null))
  assert.doesNotThrow(() => Prefs.resolvePreferences("en_US", undefined))
})
