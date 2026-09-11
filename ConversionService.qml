pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "js/conversion/index.js" as ConvertIndex
import "js/conversion/preferences.js" as ConvertPreferences
import "js/conversion/currency.js" as ConvertCurrency

// Owns the Convert capability's state and the capture -> analyze pipeline:
// resolved preferences (locale defaults + stored overrides), the cached
// currency rate table, and the current Smart Results for whatever was most
// recently captured or is on the clipboard.
//
// Three entry points feed the same analyzer (js/conversion/index.js):
//   captureRegionSmart() - region screenshot, then OCR, then analyze
//   captureOcrSmart()    - the explicit OCR action, then analyze
//   pickColourSmart()    - colour picker, then re-analyze the clipboard
// plus refresh(), which analyzes whatever is already on the clipboard when
// the panel opens (unchanged from v1.2.0, still lightweight and regex-only
// — no OCR runs just because the panel opened).
//
// Panel.qml only ever reads `results`/`analyzing`, calls the functions
// above and copyResult()/setPreference(), and listens for captureFinished
// to reopen itself once a capture's Smart Results are ready.
Item {
  id: service

  readonly property string clipboardScript: Qt.resolvedUrl("bin/capture-board-clipboard-text")
    .toString().replace(/^file:\/\//, "")
  readonly property string copyScript: Qt.resolvedUrl("bin/capture-board-copy-text")
    .toString().replace(/^file:\/\//, "")
  readonly property string regionSmartScript: Qt.resolvedUrl("bin/capture-board-region-smart")
    .toString().replace(/^file:\/\//, "")
  readonly property string ocrSmartScript: Qt.resolvedUrl("bin/capture-board-ocr-smart")
    .toString().replace(/^file:\/\//, "")
  readonly property string colourSmartScript: Qt.resolvedUrl("bin/capture-board-colour-smart")
    .toString().replace(/^file:\/\//, "")

  readonly property string stateHome: {
    var configured = Quickshell.env("XDG_STATE_HOME")
    return configured && configured !== "" ? configured : Quickshell.env("HOME") + "/.local/state"
  }
  readonly property string settingsPath: stateHome + "/omarchy/settings/capture-board.json"
  readonly property string currencyCachePath: stateHome + "/omarchy/capture-board/currency-cache.json"
  readonly property string currencyEndpoint: "https://open.er-api.com/v6/latest/USD"

  property var storedPreferences: ({})
  property bool preferencesLoaded: false
  readonly property var preferences: ConvertPreferences.resolvePreferences(Qt.locale().name, storedPreferences)

  property var currencyRates: null
  property bool currencyLoading: false

  // Smart Results currently shown. Always an array: a single clipboard
  // value is `results.length === 1`; an OCR pass can produce several.
  property var results: []
  property string lastAnalyzedText: ""
  property bool analyzing: false
  // The copyValue most recently written to the clipboard, so only the row
  // that was actually copied shows a "COPIED" confirmation — not every row.
  property string lastCopiedValue: ""

  // Emitted after a capture-driven analysis (region/OCR/colour) finishes,
  // so Panel.qml — which had to close itself for slurp/hyprpicker to see
  // the screen — knows whether to reopen. Never fired for the passive
  // clipboard-on-open path; that one just updates `results` in place.
  signal captureFinished(bool hasResults)

  function setPreference(key, value) {
    var updated = {}
    for (var k in storedPreferences) updated[k] = storedPreferences[k]
    updated[key] = value
    storedPreferences = updated
    writePreferences()
    reanalyze(lastAnalyzedText)
  }

  function writePreferences() {
    var payload = JSON.stringify({ schemaVersion: 1, convert: storedPreferences }, null, 2) + "\n"
    preferencesWriter.command = ["bash", "-c", atomicWriteScript, "capture-board-settings", settingsPath, payload]
    preferencesWriter.running = true
  }

  function reanalyze(text) {
    lastAnalyzedText = text || ""
    if (!lastAnalyzedText) { results = []; return }
    results = ConvertIndex.analyzeAll(lastAnalyzedText, preferences, { rates: currencyRates, now: Date.now() })
    if (needsCurrencyRates(results)) maybeFetchCurrency()
  }

  function needsCurrencyRates(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].category && list[i].category.indexOf("currency") === 0) return true
    }
    return false
  }

  // Called when the panel opens — the one moment Convert looks at the
  // clipboard on its own. No background watcher, no polling.
  function refresh() {
    lastCopiedValue = ""
    clipboardReader.running = false
    clipboardReader.command = [clipboardScript]
    clipboardReader.running = true
  }

  function copyResult(text) {
    if (!text) return
    lastCopiedValue = ""
    copyWriter.pendingText = text
    copyWriter.pendingCopyValue = text
    copyWriter.command = [copyScript]
    copyWriter.running = true
  }

  function copyAllResults() {
    if (!results || results.length === 0) return
    var lines = []
    for (var i = 0; i < results.length; i++) {
      var r = results[i]
      if (r.primary) lines.push(r.source + " -> " + r.primary.text)
    }
    if (lines.length > 0) copyResult(lines.join("\n"))
  }

  // ---- capture -> OCR -> analyze -------------------------------------

  function captureRegionSmart() {
    analyzing = true
    regionCapture.running = false
    regionCapture.command = [regionSmartScript]
    regionCapture.running = true
  }

  function captureOcrSmart() {
    analyzing = true
    ocrCapture.running = false
    ocrCapture.command = [ocrSmartScript]
    ocrCapture.running = true
  }

  function pickColourSmart() {
    analyzing = true
    colourPick.running = false
    colourPick.command = [colourSmartScript]
    colourPick.running = true
  }

  property FileView settingsFile: FileView {
    path: service.settingsPath
    preload: true
    printErrors: false
    onLoaded: service.loadPreferences(text())
    onLoadFailed: service.loadPreferences("")
  }

  function loadPreferences(raw) {
    var overrides = {}
    if (raw) {
      try {
        var parsed = JSON.parse(raw)
        if (parsed && parsed.convert && typeof parsed.convert === "object") overrides = parsed.convert
      } catch (e) { overrides = {} }
    }
    storedPreferences = overrides
    preferencesLoaded = true
  }

  property FileView currencyCacheFile: FileView {
    path: service.currencyCachePath
    preload: true
    printErrors: false
    onLoaded: service.loadCurrencyCache(text())
    onLoadFailed: service.loadCurrencyCache("")
  }

  function loadCurrencyCache(raw) {
    if (!raw) return
    try {
      var parsed = JSON.parse(raw)
      if (parsed && parsed.rates && typeof parsed.rates === "object") service.currencyRates = parsed
    } catch (e) { /* corrupt cache: treated the same as no cache */ }
  }

  function maybeFetchCurrency() {
    if (currencyLoading) return
    if (currencyRates && !ConvertCurrency.isStale(currencyRates)) return
    currencyLoading = true
    currencyFetch.running = true
  }

  readonly property string atomicWriteScript: "set -eu\npath=$1\npayload=$2\ndir=${path%/*}\nmkdir -p -- \"$dir\"\ntmp=$(mktemp \"$dir/.tmp.XXXXXX\")\ntrap 'rm -f -- \"$tmp\"' EXIT\numask 077\nprintf '%s' \"$payload\" > \"$tmp\"\nchmod 600 \"$tmp\"\nmv -f -- \"$tmp\" \"$path\"\ntrap - EXIT"

  property Process preferencesWriter: Process {
    running: false
    command: []
  }

  property Process currencyCacheWriter: Process {
    running: false
    command: []
  }

  property Process currencyFetch: Process {
    running: false
    command: ["curl", "-fsS", "--max-time", "6", service.currencyEndpoint]
    stdout: StdioCollector {
      id: currencyOutput
      onStreamFinished: {
        service.currencyLoading = false
        try {
          var parsed = JSON.parse(currencyOutput.text)
          if (parsed && parsed.result === "success" && parsed.rates) {
            var cache = {
              base: parsed.base_code || "USD",
              rates: parsed.rates,
              fetchedAt: Date.now()
            }
            service.currencyRates = cache
            var payload = JSON.stringify(cache, null, 2) + "\n"
            service.currencyCacheWriter.command = ["bash", "-c", service.atomicWriteScript, "capture-board-currency-cache", service.currencyCachePath, payload]
            service.currencyCacheWriter.running = true
            service.reanalyze(service.lastAnalyzedText)
          }
        } catch (e) { /* network/parse failure: keep using whatever cache we had */ }
      }
    }
  }

  property Process clipboardReader: Process {
    running: false
    command: []
    stdout: StdioCollector {
      id: clipboardOutput
      onStreamFinished: service.reanalyze(clipboardOutput.text)
    }
  }

  property Process copyWriter: Process {
    property string pendingText: ""
    property string pendingCopyValue: ""
    running: false
    command: []
    stdinEnabled: true
    onStarted: {
      write(pendingText + "\n")
      pendingText = ""
    }
    onExited: function(code) {
      if (code === 0) service.lastCopiedValue = pendingCopyValue
    }
  }

  // Region capture always "succeeds" from the panel's point of view even
  // when OCR finds nothing or the user cancels the selection — the region
  // copy itself (or its cancellation) already happened inside the script.
  // captureFinished only reports whether there is something worth
  // reopening the panel for.
  property Process regionCapture: Process {
    running: false
    command: []
    stdout: StdioCollector {
      id: regionOutput
      onStreamFinished: {
        service.analyzing = false
        service.reanalyze(regionOutput.text)
        service.captureFinished(service.results.length > 0)
      }
    }
  }

  property Process ocrCapture: Process {
    running: false
    command: []
    stdout: StdioCollector {
      id: ocrOutput
      onStreamFinished: {
        service.analyzing = false
        service.reanalyze(ocrOutput.text)
        service.captureFinished(service.results.length > 0)
      }
    }
  }

  property Process colourPick: Process {
    running: false
    command: []
    onExited: function(code) {
      service.analyzing = false
      if (code !== 0) { service.captureFinished(false); return }
      // hyprpicker already wrote the hex value to the clipboard itself;
      // re-run the same clipboard analysis the panel uses on open rather
      // than parsing colour output a second way.
      colourClipboardCheck.running = false
      colourClipboardCheck.command = [service.clipboardScript]
      colourClipboardCheck.running = true
    }
  }

  property Process colourClipboardCheck: Process {
    running: false
    command: []
    stdout: StdioCollector {
      id: colourOutput
      onStreamFinished: {
        service.reanalyze(colourOutput.text)
        service.captureFinished(service.results.length > 0)
      }
    }
  }
}
