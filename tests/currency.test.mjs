import assert from "node:assert/strict"
import test from "node:test"
import { loadQmlJs } from "./load-qml-js.mjs"

const Currency = loadQmlJs(new URL("../js/conversion/currency.js", import.meta.url))

const rates = { base: "USD", rates: { AUD: 1.5, GBP: 0.78, EUR: 0.92 }, fetchedAt: Date.now() }

test("converts through the base currency", () => {
  assert.equal(Currency.convertAmount(100, "USD", "AUD", rates), 150)
  const gbpToAud = Currency.convertAmount(100, "GBP", "AUD", rates)
  assert.equal(Math.round(gbpToAud * 100) / 100, 192.31)
})

test("same-currency conversion is a no-op", () => {
  assert.equal(Currency.convertAmount(100, "AUD", "AUD", rates), 100)
})

test("missing rate is reported as unavailable, not a wrong answer", () => {
  assert.equal(Currency.convertAmount(100, "USD", "JPY", rates), null)
  assert.equal(Currency.convertAmount(100, "USD", "AUD", null), null)
})

test("cache freshness: fresh vs stale", () => {
  const fresh = { ...rates, fetchedAt: Date.now() - 1000 }
  const stale = { ...rates, fetchedAt: Date.now() - 25 * 60 * 60 * 1000 }
  assert.equal(Currency.isStale(fresh), false)
  assert.equal(Currency.isStale(stale), true)
  assert.equal(Currency.isStale(null), true) // no data at all reads as stale/unusable
})

test("formatAge produces a short human label", () => {
  assert.match(Currency.formatAge(30 * 60 * 1000), /^\d+m old$/)
  assert.match(Currency.formatAge(8 * 60 * 60 * 1000), /^\d+h old$/)
  assert.match(Currency.formatAge(3 * 24 * 60 * 60 * 1000), /^\d+d old$/)
})

test("currency symbols for common display currencies", () => {
  assert.equal(Currency.symbolFor("AUD"), "A$")
  assert.equal(Currency.symbolFor("GBP"), "£")
  assert.equal(Currency.symbolFor("XYZ"), "XYZ ")
})
