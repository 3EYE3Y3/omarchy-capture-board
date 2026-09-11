import assert from "node:assert/strict"
import test from "node:test"
import { loadQmlJs } from "./load-qml-js.mjs"

const Extract = loadQmlJs(new URL("../js/conversion/extract.js", import.meta.url))

function categories(text, max) {
  return Array.from(Extract.extractCandidates(text, max), m => m.category)
}
function raws(text, max) {
  return Array.from(Extract.extractCandidates(text, max), m => m.raw)
}

test("finds multiple values across lines, like OCR output", () => {
  const text = "Weather today\n72°F\nWind 15 mph"
  assert.deepEqual(categories(text), ["temperature", "speed"])
})

test("finds values embedded in ordinary prose", () => {
  const text = "Outside temperature is 72°F with winds around 15 mph."
  assert.deepEqual(categories(text), ["temperature", "speed"])
  assert.deepEqual(raws(text), ["72°F", "15 mph"])
})

test("trailing sentence punctuation does not block a match", () => {
  assert.deepEqual(categories("It was 65 mph."), ["speed"])
  assert.deepEqual(categories("Weighed 150 lb, roughly."), ["mass"])
})

test("labelled multi-value block", () => {
  const text = "Temperature: 72°F\nSpeed: 65 mph\nWeight: 150 lb"
  assert.deepEqual(categories(text), ["temperature", "speed", "mass"])
})

test("does not false-positive on dates, phone numbers, IDs, or version numbers", () => {
  const text = "Order #1234567890 shipped on 2024-01-15. Call (555) 123-4567. Version 1.2.3. Total: 42%"
  assert.deepEqual(categories(text), [])
})

test("does not false-positive on ordinary reference numbers", () => {
  assert.deepEqual(categories("Invoice #48213, Item count: 12, Reference 5551234567"), [])
})

test("does not treat an ordinary word after a number as a currency code", () => {
  // "149 for" must never be read as currency code "FOR".
  assert.deepEqual(categories("149 for the flight"), [])
})

test("currency prefix form is found even though the code token has no digit", () => {
  const text = "USD 149 for the flight, plus 100 EUR for the hotel."
  assert.deepEqual(categories(text), ["currency", "currency"])
  assert.deepEqual(raws(text), ["USD 149", "100 EUR"])
})

test("currency symbol form is found in prose", () => {
  assert.deepEqual(categories("It's marked at €100 today."), ["currency"])
  assert.deepEqual(categories("Bare $100, unclear currency."), ["currencyAmbiguous"])
})

test("bare digit runs are not read as timestamps when embedded in text", () => {
  assert.deepEqual(categories("Reference number 1700000000 for your order"), [])
})

test("a full ISO-8601 timestamp with a time component is still found", () => {
  assert.deepEqual(categories("Logged at 2023-11-14T22:13:20Z during the test"), ["timestamp"])
})

test("colour hex is found inside a sentence", () => {
  assert.deepEqual(categories("Picked colour: #7A9E72"), ["colorHex"])
})

test("compound feet+inches is found as one value, not split", () => {
  assert.deepEqual(raws("Height: 5'11\" tall"), ["5'11\""])
})

test("ordinary prose with no numbers at all yields nothing", () => {
  assert.deepEqual(categories("Just an ordinary sentence with no convertible values in it at all."), [])
})

test("results are capped by maxResults", () => {
  const text = "72°F 65 mph 150 lb 100 USD 2 TB #7A9E72 90° 1 bar"
  const capped = Extract.extractCandidates(text, 3)
  assert.equal(capped.length, 3)
})

test("empty and non-string input are handled without throwing", () => {
  assert.deepEqual(categories(""), [])
  assert.doesNotThrow(() => Extract.extractCandidates(null))
  assert.doesNotThrow(() => Extract.extractCandidates(undefined))
})
