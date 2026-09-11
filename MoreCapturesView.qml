pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import qs.Commons

// Every capture mode/outcome combination that doesn't fit the compact
// CAPTURE row (Region/Screen/OCR/QR/Colour already cover the one-tap
// cases), plus the clipboard actions that aren't Copy/Cut/Paste. This
// used to be inline "More actions" content appended under the main panel;
// now it's its own view Panel.qml swaps in, so it can be as long as it
// needs without affecting the main view's height.

ColumnLayout {
  id: root

  property color foreground: Color.foreground
  signal actionRequested(string action)
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
      text: "More captures"
      color: root.foreground
      font.family: Style.font.family
      font.pixelSize: Style.font.title
      font.bold: true
    }
  }

  Text {
    text: "SCREENSHOTS"
    color: root.foreground
    opacity: 0.58
    font.family: Style.font.family
    font.pixelSize: Style.font.caption
    font.letterSpacing: 1.2
    font.bold: true
  }

  GridLayout {
    Layout.fillWidth: true
    columns: 4
    columnSpacing: Style.space(6)
    rowSpacing: Style.space(6)

    Text { text: "" }
    Text {
      text: "EDIT"
      color: root.foreground
      opacity: 0.56
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      font.bold: true
      Layout.fillWidth: true
      horizontalAlignment: Text.AlignHCenter
    }
    Text {
      text: "COPY"
      color: root.foreground
      opacity: 0.56
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      font.bold: true
      Layout.fillWidth: true
      horizontalAlignment: Text.AlignHCenter
    }
    Text {
      text: "SAVE"
      color: root.foreground
      opacity: 0.56
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      font.bold: true
      Layout.fillWidth: true
      horizontalAlignment: Text.AlignHCenter
    }

    Repeater {
      model: [
        { mode: "region", label: "Region", icon: "󰩬" },
        { mode: "smart", label: "Smart", icon: "󰍉" },
        { mode: "windows", label: "Window", icon: "󰖯" },
        { mode: "fullscreen", label: "Screen", icon: "󰍹" }
      ]

      delegate: RowLayout {
        id: screenshotRow
        required property var modelData
        Layout.columnSpan: 4
        Layout.fillWidth: true
        spacing: Style.space(6)

        Text {
          Layout.preferredWidth: Style.space(82)
          text: screenshotRow.modelData.icon + "  " + screenshotRow.modelData.label
          color: root.foreground
          font.family: Style.font.family
          font.pixelSize: Style.font.bodySmall
          font.bold: true
        }

        ActionButton {
          Layout.fillWidth: true
          compact: true
          icon: "󰏫"
          label: "Edit"
          foreground: root.foreground
          onTriggered: root.actionRequested("shot-" + screenshotRow.modelData.mode + "-edit")
        }

        ActionButton {
          Layout.fillWidth: true
          compact: true
          icon: "󰆏"
          label: "Copy"
          foreground: root.foreground
          onTriggered: root.actionRequested("shot-" + screenshotRow.modelData.mode + "-copy")
        }

        ActionButton {
          Layout.fillWidth: true
          compact: true
          icon: "󰆓"
          label: "Save"
          foreground: root.foreground
          onTriggered: root.actionRequested("shot-" + screenshotRow.modelData.mode + "-save")
        }
      }
    }
  }

  Text {
    text: "CLIPBOARD"
    color: root.foreground
    opacity: 0.58
    font.family: Style.font.family
    font.pixelSize: Style.font.caption
    font.letterSpacing: 1.2
    font.bold: true
  }

  GridLayout {
    Layout.fillWidth: true
    columns: 3
    columnSpacing: Style.space(7)
    rowSpacing: Style.space(7)

    Repeater {
      model: [
        { action: "paste-plain", label: "Paste plain", icon: "󰨸" },
        { action: "history", label: "History", icon: "󰅇" },
        { action: "share", label: "Share", icon: "󰒗" }
      ]

      delegate: ActionButton {
        required property var modelData
        Layout.fillWidth: true
        compact: true
        icon: modelData.icon
        label: modelData.label
        foreground: root.foreground
        onTriggered: root.actionRequested(modelData.action)
      }
    }
  }

  Text {
    text: "EXTRACT"
    color: root.foreground
    opacity: 0.58
    font.family: Style.font.family
    font.pixelSize: Style.font.caption
    font.letterSpacing: 1.2
    font.bold: true
  }

  ActionButton {
    Layout.fillWidth: true
    compact: true
    icon: "󰐲"
    label: "QR code"
    foreground: root.foreground
    onTriggered: root.actionRequested("qr")
  }
}
