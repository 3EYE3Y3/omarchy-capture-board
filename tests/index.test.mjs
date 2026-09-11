import assert from "node:assert/strict"
import test from "node:test"
import { loadQmlJs } from "./load-qml-js.mjs"

const Index = loadQmlJs(new URL("../js/conversion/index.js", import.meta.url))
const Prefs = loadQmlJs(new URL("../js/conversion/preferences.js", import.meta.url))

const metric = Prefs.resolvePreferences("en_AU", {})
const imperial = Prefs.resolvePreferences("en_US", {})
const rates = { base: "USD", rates: { AUD: 1.5, CAD: 1.35, GBP: 0.78, EUR: 0.92, NZD: 1.6 }, fetchedAt: Date.now() }

function analyze(text, prefs) { return Index.analyze(text, prefs || metric, { rates, now: Date.now() }) }

test("worked examples from the product spec, verbatim", () => {
  assert.equal(analyze("72°F").primary.text, "22.2°C")
  assert.equal(analyze("65 mph").primary.text, "104.6 km/h")
  assert.equal(analyze("5'11\"").primary.text, "180.3 cm")

  const fuel = analyze("15 L/100km")
  assert.equal(fuel.primary.text, "6.67 km/L")
  assert.deepEqual(Array.from(fuel.alternatives, a => a.text), ["15.7 mpg (US)", "18.8 mpg (UK)"])

  const data = analyze("2 TB")
  assert.equal(data.primary.text, "1.82 TiB")

  const colour = analyze("#7A9E72")
  assert.equal(colour.swatch.r, 122)
  assert.equal(colour.swatch.g, 158)
  assert.equal(colour.swatch.b, 114)

  assert.equal(analyze("180 cm").primary.text, "5 ft 10.9 in") // already metric -> shows the other useful representation

  const dims = analyze("6 ft x 4 ft")
  assert.equal(dims.primary.text, "1.83 m × 1.22 m")
  assert.equal(dims.alternatives[0].text, "2.23 m²")

  assert.equal(analyze("4.7 GB @ 25 MB/s").primary.text, "approximately 3m 8s")
  assert.equal(analyze("350°F for 25 minutes").primary.text, "177°C · 25 min")
})

test("timestamp: readable local datetime, plus reciprocal alternatives", () => {
  const result = analyze("1700000000")
  assert.equal(result.category, "timestamp")
  assert.ok(result.primary.text.includes("2023"))
  assert.ok(result.alternatives.some(a => a.text.startsWith("2023-11-14T")))
})

test("ordinary text produces no suggestion at all", () => {
  assert.equal(analyze("Let's grab lunch at 1 tomorrow"), null)
  assert.equal(analyze("42"), null)
  assert.equal(analyze("Capture Board makes screenshots easy"), null)
})

test("ambiguity: 12 oz offers mass and US fluid interpretations", () => {
  const result = analyze("12 oz")
  assert.equal(result.ambiguous, true)
  const labels = Array.from(result.options, o => o.label)
  assert.deepEqual(labels, ["Mass", "Fluid (US)"])
  assert.equal(result.options[0].primary.text, "340.2 g")
  assert.equal(result.options[1].primary.text, "355 mL")
})

test("ambiguity: bare $ never silently assumes USD", () => {
  const result = analyze("$100")
  assert.equal(result.ambiguous, true)
  const labels = result.options.map(o => o.label)
  assert.ok(labels.includes("USD"))
  assert.ok(labels.includes("CAD"))
  assert.ok(labels.includes("AUD"))
})

test("ambiguity: an overloaded timezone abbreviation is never resolved silently", () => {
  const result = analyze("6:00 PM IST")
  assert.equal(result.ambiguous, true)
  assert.ok(result.options.length >= 2)
})

test("unambiguous timezone abbreviations convert confidently", () => {
  const result = analyze("3:30 PM UTC")
  assert.equal(result.ambiguous, undefined)
  assert.ok(result.primary.text.includes("local"))
})

test("preference targeting: metric-preferring vs imperial-preferring users", () => {
  assert.equal(analyze("72°F", metric).primary.text, "22.2°C")
  assert.equal(analyze("22.2°C", imperial).primary.text, "72.0°F")
  assert.equal(analyze("65 mph", metric).primary.text, "104.6 km/h")
  assert.equal(analyze("100 km/h", imperial).primary.text, "62.1 mph")
})

test("currency: converts using supplied rates and reports freshness", () => {
  const result = analyze("100 USD", metric)
  assert.equal(result.category, "currency")
  assert.equal(result.primary.text, "A$150.00 AUD")
  assert.equal(result.stale, false)
})

test("currency: stale cache is reported but still used", () => {
  const staleRates = { ...rates, fetchedAt: Date.now() - 30 * 60 * 60 * 1000 }
  const result = Index.analyze("100 USD", metric, { rates: staleRates, now: Date.now() })
  assert.equal(result.stale, true)
  assert.match(result.note, /Cached rate/)
  assert.equal(result.primary.text, "A$150.00 AUD")
})

test("currency: offline (no cached rates at all) is reported, not guessed", () => {
  const result = Index.analyze("100 USD", metric, { rates: null, now: Date.now() })
  assert.equal(result.unavailable, true)
  assert.equal(result.primary, null)
})

test("currency: already the preferred currency produces no suggestion", () => {
  assert.equal(Index.analyze("100 AUD", metric, { rates }), null)
})

test("dimension safety: energy and power are never cross-converted", () => {
  const energy = analyze("5 kWh")
  assert.equal(energy.category, "energy")
  assert.ok(energy.primary.text.includes("kJ") || energy.primary.text.includes("Wh"))
  const power = analyze("1500 W")
  assert.equal(power.category, "power")
})

test("recomputation is deterministic: same input and prefs always produce the same result", () => {
  const a = analyze("72°F")
  const b = analyze("72°F")
  assert.deepEqual(a, b)
})
