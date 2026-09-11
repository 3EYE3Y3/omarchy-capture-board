pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import qs.Commons

// Convert preferences, as their own view. This used to be an "expand
// forever" section appended under the main panel — tall enough on its own
// to push the whole panel past the screen. Now Panel.qml swaps this in for
// the main view entirely (see `activeView`) instead of stacking it
// underneath, so the main capture surface stays a fixed, small height.

ColumnLayout {
  id: root

  property color foreground: Color.foreground
  property var preferences: ({})
  signal preferenceChanged(string key, string value)
  signal backRequested()

  Layout.fillWidth: true
  spacing: Style.space(12)

  RowLayout {
    Layout.fillWidth: true
    spacing: Style.space(10)

    Rectangle {
      id: backButton
      Layout.preferredWidth: Style.space(32)
      Layout.preferredHeight: Style.space(32)
      radius: Style.space(16)
      color: backMouse.containsMouse || backButton.activeFocus ? Style.hoverFillFor(root.foreground, Color.accent, Color.urgent) : "transparent"

      activeFocusOnTab: true
      Accessible.role: Accessible.Button
      Accessible.name: "Back"
      Keys.onReturnPressed: root.backRequested()
      Keys.onEnterPressed: root.backRequested()
      Keys.onSpacePressed: root.backRequested()

      Text {
        anchors.centerIn: parent
        text: "󰅁"
        color: root.foreground
        font.family: Style.font.family
        font.pixelSize: Style.font.title
      }

      MouseArea {
        id: backMouse
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: { backButton.forceActiveFocus(); root.backRequested() }
      }
    }

    Text {
      Layout.fillWidth: true
      text: "Convert preferences"
      color: root.foreground
      font.family: Style.font.family
      font.pixelSize: Style.font.title
      font.bold: true
    }
  }

  Text {
    Layout.fillWidth: true
    text: "Applies the next time a value is recognized."
    color: root.foreground
    opacity: 0.55
    font.family: Style.font.family
    font.pixelSize: Style.font.caption
    wrapMode: Text.WordWrap
  }

  PreferenceChipRow {
    label: "MEASUREMENT SYSTEM"
    foreground: root.foreground
    value: root.preferences.measurementSystem
    options: [{ value: "metric", label: "Metric" }, { value: "imperial", label: "Imperial" }]
    onSelected: function(v) { root.preferenceChanged("measurementSystem", v) }
  }

  PreferenceChipRow {
    label: "TEMPERATURE"
    foreground: root.foreground
    value: root.preferences.temperatureUnit
    options: [{ value: "c", label: "°C" }, { value: "f", label: "°F" }]
    onSelected: function(v) { root.preferenceChanged("temperatureUnit", v) }
  }

  PreferenceChipRow {
    label: "CURRENCY"
    foreground: root.foreground
    value: root.preferences.currency
    options: [
      { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" },
      { value: "AUD", label: "AUD" }, { value: "CAD", label: "CAD" }, { value: "NZD", label: "NZD" },
      { value: "JPY", label: "JPY" }, { value: "CNY", label: "CNY" }, { value: "INR", label: "INR" },
      { value: "CHF", label: "CHF" }, { value: "SGD", label: "SGD" }, { value: "HKD", label: "HKD" }
    ]
    onSelected: function(v) { root.preferenceChanged("currency", v) }
  }

  PreferenceChipRow {
    label: "FUEL ECONOMY"
    foreground: root.foreground
    value: root.preferences.fuelEconomyUnit
    options: [
      { value: "l100km", label: "L/100km" }, { value: "kml", label: "km/L" },
      { value: "mpgUS", label: "mpg (US)" }, { value: "mpgUK", label: "mpg (UK)" }
    ]
    onSelected: function(v) { root.preferenceChanged("fuelEconomyUnit", v) }
  }

  PreferenceChipRow {
    label: "TIME FORMAT"
    foreground: root.foreground
    value: root.preferences.timeFormat
    options: [{ value: "24h", label: "24h" }, { value: "12h", label: "12h" }]
    onSelected: function(v) { root.preferenceChanged("timeFormat", v) }
  }

  PreferenceChipRow {
    label: "DATA SIZE"
    foreground: root.foreground
    value: root.preferences.dataSizeUnit
    options: [{ value: "si", label: "SI (KB/MB)" }, { value: "iec", label: "IEC (KiB/MiB)" }, { value: "both", label: "Both" }]
    onSelected: function(v) { root.preferenceChanged("dataSizeUnit", v) }
  }

  Text {
    Layout.fillWidth: true
    text: "Local time (timestamps and time-zone conversions) always uses your system's timezone."
    color: root.foreground
    opacity: 0.5
    font.family: Style.font.family
    font.pixelSize: Style.font.caption
    wrapMode: Text.WordWrap
  }
}
