import assert from "node:assert/strict"
import test from "node:test"
import { loadQmlJs } from "./load-qml-js.mjs"

const Format = loadQmlJs(new URL("../js/conversion/format.js", import.meta.url))

test("formatNumber rounds and never prints negative zero", () => {
  assert.equal(Format.formatNumber(22.249, 1), "22.2")
  assert.equal(Format.formatNumber(-0.001, 1), "0.0")
  assert.equal(Format.formatNumber(NaN, 1), "—")
})

test("formatValue applies fixed per-unit decimals and unit-specific spacing", () => {
  assert.equal(Format.formatValue(22.2, "c"), "22.2°C")
  assert.equal(Format.formatValue(180.3, "cm"), "180.3 cm")
  assert.equal(Format.formatValue(68.75, "deg"), "68.8°")
})

test("formatFeetInches never reports 12.0 inches", () => {
  assert.equal(Format.formatFeetInches(5, 10.9), "5' 10.9\"")
})

test("formatDuration renders compact human units", () => {
  assert.equal(Format.formatDuration(188), "3m 8s")
  assert.equal(Format.formatDuration(90061), "1d 1h 1m 1s")
  assert.equal(Format.formatDuration(0), "0s")
})

test("formatDateTime honours 12h/24h preference", () => {
  const date = new Date(Date.UTC(2023, 10, 14, 22, 13, 20))
  // Use UTC-equivalent getters by constructing the date at the same wall time.
  const local = new Date(date.getTime())
  const h24 = Format.formatDateTime(local, "24h")
  const h12 = Format.formatDateTime(local, "12h")
  assert.match(h24, /^[A-Za-z]{3} \d{1,2}, \d{4} \d{2}:\d{2}:\d{2}$/)
  assert.match(h12, /^[A-Za-z]{3} \d{1,2}, \d{4} \d{1,2}:\d{2}:\d{2} (AM|PM)$/)
})

test("colour formatting helpers", () => {
  assert.equal(Format.formatHex(122, 158, 114), "#7a9e72")
  assert.equal(Format.formatRgb(122, 158, 114), "RGB 122, 158, 114")
  assert.equal(Format.formatHsl(109.2, 18.4, 53.3), "HSL 109°, 18%, 53%")
})
