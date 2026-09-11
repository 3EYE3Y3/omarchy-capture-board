import assert from "node:assert/strict"
import test from "node:test"
import { loadQmlJs } from "./load-qml-js.mjs"

const Parse = loadQmlJs(new URL("../js/conversion/parse.js", import.meta.url))

test("temperature recognition", () => {
  assert.equal(Parse.recognize("72°F").category, "temperature")
  assert.equal(Parse.recognize("-40°C").unit, "c")
  assert.equal(Parse.recognize("300K").unit, "k")
  assert.equal(Parse.recognize("98.6 degrees Fahrenheit").category, "temperature")
})

test("length recognition, including compound feet/inches", () => {
  assert.equal(Parse.recognize("180 cm").category, "length")
  assert.equal(Parse.recognize("3.5 km").unit, "km")
  const compound = Parse.recognize("5'11\"")
  assert.equal(compound.category, "lengthCompound")
  assert.equal(compound.feet, 5)
  assert.equal(compound.inches, 11)
  assert.equal(Parse.recognize("6 ft 2 in").category, "lengthCompound")
  assert.equal(Parse.recognize("5 feet 8 inches").category, "lengthCompound")
})

test("area recognition", () => {
  assert.equal(Parse.recognize("2 acres").category, "area")
  assert.equal(Parse.recognize("500 m2").unit, "m2")
  assert.equal(Parse.recognize("500 m²").unit, "m2")
  assert.equal(Parse.recognize("12 sq ft").unit, "ft2")
  assert.equal(Parse.recognize("3 hectares").unit, "hectare")
})

test("volume recognition distinguishes US and UK", () => {
  assert.equal(Parse.recognize("2 cups").category, "volume")
  assert.equal(Parse.recognize("1 gallon US").unit, "galUS")
  assert.equal(Parse.recognize("1 gallon UK").unit, "galUK")
  assert.equal(Parse.recognize("1 fl oz").unit, "flozUS")
  assert.equal(Parse.recognize("1 fl oz UK").unit, "flozUK")
})

test("mass recognition, and bare ounces stay ambiguous", () => {
  assert.equal(Parse.recognize("2 kg").category, "mass")
  assert.equal(Parse.recognize("5 lb").category, "mass")
  assert.equal(Parse.recognize("12 oz").category, "massOrVolumeAmbiguous")
  assert.equal(Parse.recognize("1 fl oz").category, "volume") // "fl" prefix disambiguates
})

test("speed recognition", () => {
  assert.equal(Parse.recognize("65 mph").unit, "mph")
  assert.equal(Parse.recognize("100 km/h").unit, "kmh")
  assert.equal(Parse.recognize("20 knots").unit, "knot")
  assert.equal(Parse.recognize("5 m/s").unit, "mps")
})

test("pressure recognition", () => {
  assert.equal(Parse.recognize("1013 hPa").unit, "hpa")
  assert.equal(Parse.recognize("30 psi").unit, "psi")
  assert.equal(Parse.recognize("1 bar").unit, "bar")
})

test("energy and power are recognized as distinct categories", () => {
  assert.equal(Parse.recognize("5 kWh").category, "energy")
  assert.equal(Parse.recognize("1500 W").category, "power")
  assert.equal(Parse.recognize("2 kW").category, "power")
})

test("data size recognition distinguishes SI and IEC", () => {
  assert.equal(Parse.recognize("2 TB").unit, "tb")
  assert.equal(Parse.recognize("2 TiB").unit, "tib")
  assert.equal(Parse.recognize("500 MB").unit, "mb")
  assert.equal(Parse.recognize("500 MiB").unit, "mib")
})

test("duration recognition", () => {
  assert.equal(Parse.recognize("90 min").category, "duration")
  assert.equal(Parse.recognize("2 hours").unit, "hour")
  assert.equal(Parse.recognize("3 days").unit, "day")
})

test("timestamps: seconds, milliseconds, ISO-8601", () => {
  assert.equal(Parse.recognize("1700000000").category, "timestamp")
  assert.equal(Parse.recognize("1700000000000").category, "timestamp")
  assert.equal(Parse.recognize("2023-11-14T22:13:20Z").category, "timestamp")
  assert.equal(Parse.recognize("2023-11-14").category, "timestamp")
})

test("ordinary integers are not misclassified as timestamps", () => {
  assert.equal(Parse.recognize("42"), null)
  assert.equal(Parse.recognize("2023"), null)
  assert.equal(Parse.recognize("123456"), null) // 6 digits: not 10 or 13
  assert.equal(Parse.recognize("12345678901234"), null) // 14 digits: not 10 or 13
})

test("time zone expressions", () => {
  const m = Parse.recognize("3:30 PM UTC")
  assert.equal(m.category, "timezoneTime")
  assert.equal(m.hour, 15)
  assert.equal(m.minute, 30)
  assert.equal(m.abbr, "UTC")
  assert.equal(Parse.recognize("09:00 GMT").hour, 9)
})

test("fuel economy recognition", () => {
  assert.equal(Parse.recognize("15 L/100km").unit, "l100km")
  assert.equal(Parse.recognize("6.67 km/L").unit, "kml")
  assert.equal(Parse.recognize("30 mpg US").unit, "mpgUS")
  assert.equal(Parse.recognize("35 mpg UK").unit, "mpgUK")
})

test("colour recognition: hex, rgb, hsl", () => {
  assert.equal(Parse.recognize("#7A9E72").category, "colorHex")
  assert.equal(Parse.recognize("#79E").category, "colorHex")
  assert.equal(Parse.recognize("7A9E72"), null) // no "#": too easily confused with an ordinary number
  const rgb = Parse.recognize("rgb(122, 158, 114)")
  assert.equal(rgb.category, "colorRgb")
  assert.equal(rgb.g, 158)
  assert.equal(Parse.recognize("hsl(96, 22%, 53%)").category, "colorHsl")
  assert.equal(Parse.recognize("rgb(300, 1, 1)"), null) // out of range
})

test("angle recognition", () => {
  assert.equal(Parse.recognize("90°").unit, "deg")
  assert.equal(Parse.recognize("1.2 rad").unit, "rad")
})

test("currency recognition: codes and symbols", () => {
  assert.equal(Parse.recognize("100 USD").category, "currency")
  assert.equal(Parse.recognize("USD 100").category, "currency")
  assert.equal(Parse.recognize("£50").currency, "GBP")
  assert.equal(Parse.recognize("€100").currency, "EUR")
  const ambiguous = Parse.recognize("$100")
  assert.equal(ambiguous.category, "currencyAmbiguous")
  assert.ok(ambiguous.candidates.includes("USD"))
})

test("compound expressions", () => {
  assert.equal(Parse.recognize("6 ft x 4 ft").category, "compoundDimensions")
  assert.equal(Parse.recognize("6 ft × 4 ft").category, "compoundDimensions")
  assert.equal(Parse.recognize("4.7 GB @ 25 MB/s").category, "compoundTransferTime")
  assert.equal(Parse.recognize("350°F for 25 minutes").category, "compoundCookTime")
})

test("ordinary text and ambiguous overlaps do not falsely match", () => {
  assert.equal(Parse.recognize("this is just an ordinary sentence"), null)
  assert.equal(Parse.recognize("Meet me at 5"), null)
  assert.equal(Parse.recognize(""), null)
  assert.equal(Parse.recognize("   "), null)
  assert.equal(Parse.recognize("a".repeat(200)), null) // too long to be a captured value
})
