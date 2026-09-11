pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import qs.Commons

// The "SMART RESULTS" block: a header, one compact ConvertCard row per
// recognized value, and — only once there is more than one — a Copy All
// action. This is the only place that knows there can be *several* Smart
// Results at once; ConvertCard itself still only ever renders one.

ColumnLayout {
  id: root

  property var results: []
  property bool analyzing: false
  property string lastCopiedValue: ""
  property color foreground: Color.foreground
  signal copyRequested(string text)

  readonly property string allResultsText: {
    var lines = []
    for (var i = 0; i < root.results.length; i++) {
      var r = root.results[i]
      if (r.primary) lines.push(r.source + " -> " + r.primary.text)
    }
    return lines.join("\n")
  }

  Layout.fillWidth: true
  spacing: Style.space(8)
  visible: root.results.length > 0 || root.analyzing

  RowLayout {
    Layout.fillWidth: true
    spacing: Style.space(8)

    Text {
      text: "SMART RESULTS"
      color: root.foreground
      opacity: 0.58
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      font.letterSpacing: 1.2
      font.bold: true
    }

    Text {
      Layout.fillWidth: true
      visible: root.analyzing
      text: "Analyzing…"
      color: root.foreground
      opacity: 0.5
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      horizontalAlignment: Text.AlignRight
    }

    Rectangle {
      id: copyAllButton
      visible: root.results.length > 1
      implicitWidth: copyAllLabel.implicitWidth + Style.space(16)
      implicitHeight: Style.space(24)
      radius: Style.space(12)
      color: copyAllMouse.pressed
        ? Style.pressedFillFor(root.foreground, Color.accent, Color.urgent)
        : (copyAllMouse.containsMouse || copyAllButton.activeFocus
            ? Style.hoverFillFor(root.foreground, Color.accent, Color.urgent)
            : "transparent")
      border.width: Style.normalBorderWidth
      border.color: Style.normalBorderFor(root.foreground, Color.accent, Color.urgent)

      activeFocusOnTab: true
      Accessible.role: Accessible.Button
      Accessible.name: "Copy all results"

      Keys.onReturnPressed: root.copyRequested(root.allResultsText)
      Keys.onEnterPressed: root.copyRequested(root.allResultsText)
      Keys.onSpacePressed: root.copyRequested(root.allResultsText)

      Text {
        id: copyAllLabel
        anchors.centerIn: parent
        text: root.lastCopiedValue !== "" && root.lastCopiedValue === root.allResultsText ? "COPIED" : "COPY ALL"
        color: root.foreground
        opacity: 0.8
        font.family: Style.font.family
        font.pixelSize: Style.font.caption
        font.bold: true
      }

      MouseArea {
        id: copyAllMouse
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: { copyAllButton.forceActiveFocus(); root.copyRequested(root.allResultsText) }
      }
    }
  }

  ColumnLayout {
    Layout.fillWidth: true
    spacing: Style.space(6)

    Repeater {
      model: root.results

      delegate: ConvertCard {
        id: card
        required property var modelData
        Layout.fillWidth: true
        result: card.modelData
        foreground: root.foreground
        copyConfirmed: root.lastCopiedValue !== "" && !!card.modelData.primary && root.lastCopiedValue === card.modelData.primary.copyValue
        onCopyRequested: function(text) { root.copyRequested(text) }
      }
    }
  }
}
