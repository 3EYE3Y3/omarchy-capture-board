pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import qs.Commons

// Renders one ConversionService.result: the recognized value, its
// suggested conversion(s), and a Copy Result affordance. Nothing here
// recognizes or converts anything — it only displays whatever
// js/conversion/index.js already decided, so a future non-Convert
// suggested action can reuse this same "recognized value -> actions" shape
// without this file needing to change.

ColumnLayout {
  id: root

  property var result: null
  property bool copyConfirmed: false
  property color foreground: Color.foreground
  signal copyRequested(string text)

  Layout.fillWidth: true
  spacing: Style.space(8)
  visible: root.result !== null

  RowLayout {
    Layout.fillWidth: true
    spacing: Style.space(8)

    Text {
      text: "CONVERT"
      color: root.foreground
      opacity: 0.58
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      font.letterSpacing: 1.2
      font.bold: true
    }

    Text {
      Layout.fillWidth: true
      text: root.result ? root.result.source : ""
      color: root.foreground
      opacity: 0.55
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      elide: Text.ElideRight
      horizontalAlignment: Text.AlignRight
    }
  }

  // Ambiguous: several plausible readings (12 oz, bare $, an overloaded
  // timezone abbreviation) — never guess, offer each as its own row.
  ColumnLayout {
    Layout.fillWidth: true
    visible: root.result !== null && root.result.ambiguous === true
    spacing: Style.space(4)

    Repeater {
      model: root.result && root.result.ambiguous ? root.result.options : []

      delegate: Rectangle {
        id: optionRow
        required property var modelData
        Layout.fillWidth: true
        implicitHeight: optionContent.implicitHeight + Style.space(14)
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
            font.pixelSize: Style.font.body
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

  // Confident: one primary suggestion (with a Copy Result action) plus any
  // supplementary representations underneath.
  ColumnLayout {
    Layout.fillWidth: true
    visible: root.result !== null && root.result.ambiguous !== true
    spacing: Style.space(6)

    RowLayout {
      Layout.fillWidth: true
      spacing: Style.space(10)

      Rectangle {
        visible: !!(root.result && root.result.swatch)
        Layout.preferredWidth: Style.space(28)
        Layout.preferredHeight: Style.space(28)
        radius: Style.space(6)
        border.width: 1
        border.color: Qt.rgba(0, 0, 0, 0.25)
        color: root.result && root.result.swatch
          ? Qt.rgba(root.result.swatch.r / 255, root.result.swatch.g / 255, root.result.swatch.b / 255, 1)
          : "transparent"
      }

      Text {
        Layout.fillWidth: true
        text: root.result && root.result.primary ? root.result.primary.text : (root.result ? root.result.note : "")
        color: root.foreground
        opacity: root.result && root.result.primary ? 1 : 0.6
        font.family: Style.font.family
        font.pixelSize: Style.font.subtitle
        font.bold: true
        elide: Text.ElideRight
      }

      Rectangle {
        id: copyButton
        visible: !!(root.result && root.result.primary)
        implicitWidth: copyLabel.implicitWidth + Style.space(18)
        implicitHeight: Style.space(30)
        radius: Style.space(15)
        color: copyMouse.pressed
          ? Style.pressedFillFor(root.foreground, Color.accent, Color.urgent)
          : (copyMouse.containsMouse || copyButton.activeFocus
              ? Style.hoverFillFor(root.foreground, Color.accent, Color.urgent)
              : Style.normalFillFor(root.foreground, Color.accent, Color.urgent))
        border.width: Style.normalBorderWidth
        border.color: Style.normalBorderFor(root.foreground, Color.accent, Color.urgent)

        activeFocusOnTab: true
        Accessible.role: Accessible.Button
        Accessible.name: "Copy result"

        Keys.onReturnPressed: root.result && root.result.primary && root.copyRequested(root.result.primary.copyValue)
        Keys.onEnterPressed: root.result && root.result.primary && root.copyRequested(root.result.primary.copyValue)
        Keys.onSpacePressed: root.result && root.result.primary && root.copyRequested(root.result.primary.copyValue)

        Text {
          id: copyLabel
          anchors.centerIn: parent
          text: root.copyConfirmed ? "COPIED" : "COPY RESULT"
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

    Text {
      Layout.fillWidth: true
      visible: !!(root.result && root.result.note && root.result.primary)
      text: root.result ? (root.result.note || "") : ""
      color: root.foreground
      opacity: 0.55
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
    }

    Repeater {
      model: root.result && !root.result.ambiguous && root.result.alternatives ? root.result.alternatives : []

      delegate: Rectangle {
        id: altRow
        required property var modelData
        Layout.fillWidth: true
        implicitHeight: altLabel.implicitHeight + Style.space(8)
        radius: Style.space(5)
        color: altMouse.containsMouse ? Style.hoverFillFor(root.foreground, Color.accent, Color.urgent) : "transparent"

        Text {
          id: altLabel
          anchors.left: parent.left
          anchors.right: parent.right
          anchors.verticalCenter: parent.verticalCenter
          anchors.leftMargin: Style.space(6)
          anchors.rightMargin: Style.space(6)
          text: altRow.modelData.text
          color: root.foreground
          opacity: 0.72
          font.family: Style.font.family
          font.pixelSize: Style.font.bodySmall
          elide: Text.ElideRight
        }

        MouseArea {
          id: altMouse
          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: root.copyRequested(altRow.modelData.copyValue)
        }
      }
    }
  }
}
