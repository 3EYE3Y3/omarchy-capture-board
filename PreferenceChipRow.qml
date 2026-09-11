pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import qs.Commons

// One row of a compact Convert-preferences section: a label and a set of
// tap-to-select pill chips (measurement system, currency, etc). Kept as a
// single reusable row instead of pulling in the shared shell's Dropdown —
// that component's keyboard-cursor model assumes a panel-wide focus-section
// controller Capture Board's simpler Tab-driven panel doesn't have, and a
// handful of short option lists reads fine as chips.

ColumnLayout {
  id: root

  property string label: ""
  property var options: [] // [{ value, label }]
  property string value: ""
  property color foreground: Color.foreground
  signal selected(string value)

  Layout.fillWidth: true
  spacing: Style.space(4)

  Text {
    text: root.label
    color: root.foreground
    opacity: 0.58
    font.family: Style.font.family
    font.pixelSize: Style.font.caption
    font.letterSpacing: 0.6
    font.bold: true
  }

  Flow {
    Layout.fillWidth: true
    spacing: Style.space(6)

    Repeater {
      model: root.options

      delegate: Rectangle {
        id: chip
        required property var modelData
        readonly property bool isSelected: chip.modelData.value === root.value

        implicitWidth: chipLabel.implicitWidth + Style.space(18)
        implicitHeight: Style.space(30)
        radius: Style.space(15)
        color: chip.isSelected
          ? Color.accent
          : (mouse.containsMouse || chip.activeFocus ? Style.hoverFillFor(root.foreground, Color.accent, Color.urgent) : "transparent")
        border.width: Style.normalBorderWidth
        border.color: chip.isSelected ? Color.accent : Style.normalBorderFor(root.foreground, Color.accent, Color.urgent)

        activeFocusOnTab: true
        Accessible.role: Accessible.Button
        Accessible.name: chip.modelData.label

        Keys.onReturnPressed: root.selected(chip.modelData.value)
        Keys.onEnterPressed: root.selected(chip.modelData.value)
        Keys.onSpacePressed: root.selected(chip.modelData.value)

        Text {
          id: chipLabel
          anchors.centerIn: parent
          text: chip.modelData.label
          color: chip.isSelected ? Color.background : root.foreground
          font.family: Style.font.family
          font.pixelSize: Style.font.caption
          font.bold: chip.isSelected
        }

        MouseArea {
          id: mouse
          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: { chip.forceActiveFocus(); root.selected(chip.modelData.value) }
        }
      }
    }
  }
}
