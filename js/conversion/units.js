.pragma library

// Static unit definitions for the Convert capability. Every non-temperature,
// non-currency unit is defined as a linear factor to one base unit per
// dimension, so conversion is a single multiply/divide (see convert.js).
// Keeping the tables here (rather than inline in the parser or the QML
// panel) is what lets both parse.js and convert.js stay dimension-agnostic.

var LENGTH_BASE = "m"
var LENGTH = {
  mm: 0.001, cm: 0.01, m: 1, km: 1000,
  in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344
}

var AREA_BASE = "m2"
var AREA = {
  mm2: 0.000001, cm2: 0.0001, m2: 1, km2: 1000000,
  ft2: 0.09290304, yd2: 0.83612736,
  acre: 4046.8564224, hectare: 10000
}

// US liquid units unless noted; UK (imperial) units kept distinct.
var VOLUME_BASE = "l"
var VOLUME = {
  ml: 0.001, l: 1,
  flozUS: 0.0295735295625, cupUS: 0.2365882365,
  pintUS: 0.473176473, quartUS: 0.946352946, galUS: 3.785411784,
  flozUK: 0.0284130625, pintUK: 0.56826125, quartUK: 1.1365225, galUK: 4.54609
}

var MASS_BASE = "g"
var MASS = {
  mg: 0.001, g: 1, kg: 1000,
  oz: 28.349523125, lb: 453.59237, stone: 6350.29318
}

var SPEED_BASE = "mps"
var SPEED = {
  mps: 1, kmh: 1 / 3.6, mph: 0.44704, knot: 0.5144444444444444
}

var PRESSURE_BASE = "pa"
var PRESSURE = {
  pa: 1, kpa: 1000, hpa: 100, bar: 100000, psi: 6894.757293168,
  inhg: 3386.389
}

var ENERGY_BASE = "j"
var ENERGY = { j: 1, kj: 1000, wh: 3600, kwh: 3600000 }

var POWER_BASE = "w"
var POWER = { w: 1, kw: 1000 }

// Data size: two independent unit families sharing one base (bytes). SI
// units are decimal (1000^n); IEC units are binary (1024^n). "2 TB -> TiB"
// means: interpret the input bytes, then re-express in the other family.
var DATA_BASE = "b"
var DATA = {
  b: 1,
  kb: 1000, mb: 1000 ** 2, gb: 1000 ** 3, tb: 1000 ** 4,
  kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4
}

var TIME_BASE = "s"
var TIME = { s: 1, min: 60, hour: 3600, day: 86400 }

var ANGLE_BASE = "deg"
var ANGLE = { deg: 1, rad: 180 / Math.PI }

// Fixed-offset timezone abbreviations, in minutes east of UTC. Only
// abbreviations with one common, non-DST-ambiguous meaning are listed here;
// genuinely overloaded abbreviations (IST, CST used for multiple regions,
// etc.) are handled as low-confidence/ambiguous by the timezone parser
// instead of being given a single silent answer.
var TZ_OFFSET_MINUTES = {
  UTC: 0, GMT: 0, Z: 0,
  EST: -300, EDT: -240,
  CST: -360, CDT: -300,
  MST: -420, MDT: -360,
  PST: -480, PDT: -420,
  BST: 60,
  CET: 60, CEST: 120,
  AEST: 600, AEDT: 660,
  NZST: 720, NZDT: 780,
  JST: 540
}

// Abbreviations that map to more than one real-world zone and must never be
// resolved silently.
var TZ_AMBIGUOUS = { IST: ["India (UTC+5:30)", "Ireland (UTC+1)"], WST: ["Australia (UTC+8)", "Samoa (UTC-11)"] }

function unitBytes(name) { return DATA[name] }

function isSiDataUnit(name) { return name === "kb" || name === "mb" || name === "gb" || name === "tb" }
function isIecDataUnit(name) { return name === "kib" || name === "mib" || name === "gib" || name === "tib" }
