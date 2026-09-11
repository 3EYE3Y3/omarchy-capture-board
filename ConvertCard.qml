pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import qs.Commons

// Renders one Smart Result: the recognized value, its suggested
// conversion, and a Copy action — as a single compact row so several of
// these can sit in a bounded list without the panel outgrowing the screen.
// Nothing here recognizes or converts anything; it only displays whatever
// js/conversion/index.js already decided, so a future non-Convert
// suggested action can reuse this same "recognized value -> actions" shape.

ColumnLayout {
  id: root

  property var result: null
  property bool copyConfirmed: false
  property color foreground: Color.foreground
  signal copyRequested(string text)

  Layout.fillWidth: true
  spacing: Style.space(3)
  visible: root.result !== null

  // Ambiguous: several plausible readings (12 oz, bare $, an overloaded
  // timezone abbreviation) — never guess, offer each as its own row.
  ColumnLayout {
    Layout.fillWidth: true
    visible: root.result !== null && root.result.ambiguous === true
    spacing: Style.space(3)

    Text {
      Layout.fillWidth: true
      text: root.result ? root.result.source : ""
      color: root.foreground
      opacity: 0.55
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      elide: Text.ElideRight
    }

    Repeater {
      model: root.result && root.result.ambiguous ? root.result.options : []

      delegate: Rectangle {
        id: optionRow
        required property var modelData
        Layout.fillWidth: true
        implicitHeight: optionContent.implicitHeight + Style.space(10)
        radius: Style.space(6)
        color: optionMouse.containsMouse && optionRow.modelData.primary
          ? Style.hoverFillFor(root.foreground, Color.accent, Color.urgent)
          : "transparent"
        border.width: Style.normalBorderWidth
        border.color: Style.normalBorderFor(root.foreground, Color.accent, Color.urgent)

        RowLayout {
          id: optionContent
          anchors.left: parent.left
          anchors.right: parent.right
          anchors.verticalCenter: parent.verticalCenter
          anchors.leftMargin: Style.space(10)
          anchors.rightMargin: Style.space(10)
          spacing: Style.space(8)

          Text {
            text: optionRow.modelData.label
            color: root.foreground
            opacity: 0.7
            font.family: Style.font.family
            font.pixelSize: Style.font.bodySmall
            font.bold: true
          }

          Text {
            Layout.fillWidth: true
            text: optionRow.modelData.primary ? optionRow.modelData.primary.text : "—"
            color: root.foreground
            font.family: Style.font.family
            font.pixelSize: Style.font.bodySmall
            elide: Text.ElideRight
            horizontalAlignment: Text.AlignRight
          }
        }

        MouseArea {
          id: optionMouse
          anchors.fill: parent
          hoverEnabled: true
          enabled: !!optionRow.modelData.primary
          cursorShape: optionRow.modelData.primary ? Qt.PointingHandCursor : Qt.ArrowCursor
          onClicked: root.copyRequested(optionRow.modelData.primary.copyValue)
        }
      }
    }
  }

  // Confident: source -> primary value on one line, Copy on the trailing
  // edge, any alternatives folded into a single muted caption underneath.
  RowLayout {
    Layout.fillWidth: true
    visible: root.result !== null && root.result.ambiguous !== true
    spacing: Style.space(8)

    Rectangle {
      visible: !!(root.result && root.result.swatch)
      Layout.preferredWidth: Style.space(20)
      Layout.preferredHeight: Style.space(20)
      radius: Style.space(5)
      border.width: 1
      border.color: Qt.rgba(0, 0, 0, 0.25)
      color: root.result && root.result.swatch
        ? Qt.rgba(root.result.swatch.r / 255, root.result.swatch.g / 255, root.result.swatch.b / 255, 1)
        : "transparent"
    }

    ColumnLayout {
      Layout.fillWidth: true
      spacing: 0

      Text {
        Layout.fillWidth: true
        text: root.result && root.result.primary
          ? root.result.source + "  →  " + root.result.primary.text
          : (root.result ? root.result.source : "")
        color: root.foreground
        font.family: Style.font.family
        font.pixelSize: Style.font.body
        font.bold: true
        elide: Text.ElideRight
      }

      Text {
        Layout.fillWidth: true
        visible: !!(root.result && (root.result.note || (root.result.alternatives && root.result.alternatives.length > 0)))
        text: root.result ? (root.result.note || (root.result.alternatives || []).map(function(a) { return a.text }).join("  ·  ")) : ""
        color: root.foreground
        opacity: 0.55
        font.family: Style.font.family
        font.pixelSize: Style.font.caption
        elide: Text.ElideRight
      }
    }

    Rectangle {
      id: copyButton
      visible: !!(root.result && root.result.primary)
      implicitWidth: copyLabel.implicitWidth + Style.space(16)
      implicitHeight: Style.space(26)
      radius: Style.space(13)
      color: copyMouse.pressed
        ? Style.pressedFillFor(root.foreground, Color.accent, Color.urgent)
        : (copyMouse.containsMouse || copyButton.activeFocus
            ? Style.hoverFillFor(root.foreground, Color.accent, Color.urgent)
            : Style.normalFillFor(root.foreground, Color.accent, Color.urgent))
      border.width: Style.normalBorderWidth
      border.color: Style.normalBorderFor(root.foreground, Color.accent, Color.urgent)

      activeFocusOnTab: true
      Accessible.role: Accessible.Button
      Accessible.name: "Copy result: " + (root.result && root.result.primary ? root.result.primary.text : "")

      Keys.onReturnPressed: root.result && root.result.primary && root.copyRequested(root.result.primary.copyValue)
      Keys.onEnterPressed: root.result && root.result.primary && root.copyRequested(root.result.primary.copyValue)
      Keys.onSpacePressed: root.result && root.result.primary && root.copyRequested(root.result.primary.copyValue)

      Text {
        id: copyLabel
        anchors.centerIn: parent
        text: root.copyConfirmed ? "COPIED" : "COPY"
        color: root.foreground
        font.family: Style.font.family
        font.pixelSize: Style.font.caption
        font.bold: true
      }

      MouseArea {
        id: copyMouse
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: {
          copyButton.forceActiveFocus()
          if (root.result && root.result.primary) root.copyRequested(root.result.primary.copyValue)
        }
      }
    }
  }
}
