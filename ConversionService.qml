pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io
import "js/conversion/index.js" as ConvertIndex
import "js/conversion/preferences.js" as ConvertPreferences
import "js/conversion/currency.js" as ConvertCurrency

// Owns the Convert capability's state: resolved preferences (locale
// defaults merged with the user's stored overrides), the cached currency
// rate table, and the current recognized-value result for whatever is on
// the clipboard right now. Panel.qml only ever reads `result` and calls
// `refresh()` / `copyResult()` / `setPreference()` — every recognition and
// conversion rule lives in js/conversion/, not here or in the UI.
Item {
  id: service

  readonly property string clipboardScript: Qt.resolvedUrl("bin/capture-board-clipboard-text")
    .toString().replace(/^file:\/\//, "")
  readonly property string copyScript: Qt.resolvedUrl("bin/capture-board-copy-text")
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

  property var result: null
  property string lastClipboardText: ""
  property bool copyConfirmed: false

  signal copied()

  function setPreference(key, value) {
    var updated = {}
    for (var k in storedPreferences) updated[k] = storedPreferences[k]
    updated[key] = value
    storedPreferences = updated
    writePreferences()
    reanalyze(lastClipboardText)
  }

  function writePreferences() {
    var payload = JSON.stringify({ schemaVersion: 1, convert: storedPreferences }, null, 2) + "\n"
    preferencesWriter.command = ["bash", "-c", atomicWriteScript, "capture-board-settings", settingsPath, payload]
    preferencesWriter.running = true
  }

  function reanalyze(text) {
    lastClipboardText = text || ""
    if (!lastClipboardText) { result = null; return }
    result = ConvertIndex.analyze(lastClipboardText, preferences, { rates: currencyRates, now: Date.now() })
    if (result && result.category && result.category.indexOf("currency") === 0) maybeFetchCurrency()
  }

  // Called when the panel opens — the one moment Convert needs to look at
  // the clipboard. There is no background watcher and no polling.
  function refresh() {
    copyConfirmed = false
    clipboardReader.running = false
    clipboardReader.command = [clipboardScript]
    clipboardReader.running = true
  }

  function copyResult(text) {
    if (!text) return
    copyConfirmed = false
    copyWriter.pendingText = text
    copyWriter.command = [copyScript]
    copyWriter.running = true
  }

  function maybeFetchCurrency() {
    if (currencyLoading) return
    if (currencyRates && !ConvertCurrency.isStale(currencyRates)) return
    currencyLoading = true
    currencyFetch.running = true
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
    id: currencyFetchProc
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
            service.reanalyze(service.lastClipboardText)
          }
        } catch (e) { /* network/parse failure: keep using whatever cache we had */ }
      }
    }
  }

  property Process clipboardReader: Process {
    id: clipboardReaderProc
    running: false
    command: []
    stdout: StdioCollector {
      id: clipboardOutput
      onStreamFinished: service.reanalyze(clipboardOutput.text)
    }
  }

  property Process copyWriter: Process {
    id: copyWriterProc
    property string pendingText: ""
    running: false
    command: []
    stdinEnabled: true
    onStarted: {
      write(pendingText + "\n")
      pendingText = ""
    }
    onExited: function(code) {
      if (code === 0) { service.copyConfirmed = true; service.copied() }
    }
  }
}
