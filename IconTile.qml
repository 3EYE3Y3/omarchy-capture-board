import QtQuick
import QtQuick.Layouts
import qs.Commons

// A compact icon-over-caption button for the primary CAPTURE/CLIPBOARD
// rows. ActionButton's icon+label pill reads fine at one or two per row,
// but five across the panel's width need a much smaller footprint — this
// is what keeps the main view to two short rows instead of a tall stack.

Rectangle {
  id: root

  property string icon: ""
  property string label: ""
  property string hint: ""
  property color foreground: Color.foreground
  property color accent: Color.accent
  signal triggered()

  Layout.fillWidth: true
  Layout.preferredHeight: Style.space(56)
  radius: Math.max(Style.space(5), Style.cornerRadius)
  color: mouse.pressed
    ? Style.pressedFillFor(foreground, accent, Color.urgent)
    : (mouse.containsMouse || activeFocus ? Style.hoverFillFor(foreground, accent, Color.urgent) : Style.normalFillFor(foreground, accent, Color.urgent))
  border.width: mouse.containsMouse || activeFocus ? Style.hoverBorderWidth : Style.normalBorderWidth
  border.color: mouse.containsMouse || activeFocus ? Style.hoverBorderFor(foreground, accent, Color.urgent) : Style.normalBorderFor(foreground, accent, Color.urgent)

  activeFocusOnTab: true
  Accessible.role: Accessible.Button
  Accessible.name: label
  Accessible.description: hint

  Keys.onReturnPressed: root.triggered()
  Keys.onEnterPressed: root.triggered()
  Keys.onSpacePressed: root.triggered()

  ColumnLayout {
    anchors.centerIn: parent
    spacing: Style.space(2)
    width: parent.width - Style.space(6)

    Text {
      Layout.alignment: Qt.AlignHCenter
      text: root.icon
      color: root.accent
      font.family: Style.font.family
      font.pixelSize: Style.font.title
    }

    Text {
      Layout.fillWidth: true
      Layout.alignment: Qt.AlignHCenter
      text: root.label
      color: root.foreground
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      font.bold: true
      elide: Text.ElideRight
      horizontalAlignment: Text.AlignHCenter
    }
  }

  MouseArea {
    id: mouse
    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: { root.forceActiveFocus(); root.triggered() }
  }
}
