import QtQuick
import QtQuick.Layouts
import qs.Commons

Rectangle {
  id: root

  property string icon: ""
  property string label: ""
  property string hint: ""
  property bool compact: false
  property bool prominent: false
  property color foreground: Color.foreground
  property color accent: Color.accent
  signal triggered()

  implicitWidth: compact ? Style.space(116) : Style.space(154)
  implicitHeight: prominent ? Style.space(68) : (compact ? Style.space(42) : Style.space(58))
  radius: Math.max(Style.space(5), Style.cornerRadius)
  color: mouse.pressed
    ? Style.pressedFillFor(foreground, accent, Color.urgent)
    : (prominent || mouse.containsMouse || activeFocus
        ? Style.hoverFillFor(foreground, accent, Color.urgent)
        : Style.normalFillFor(foreground, accent, Color.urgent))
  border.width: prominent
    ? Math.max(2, Style.hoverBorderWidth)
    : (mouse.containsMouse || activeFocus
    ? Style.hoverBorderWidth
    : Style.normalBorderWidth)
  border.color: prominent || mouse.containsMouse || activeFocus
    ? Style.hoverBorderFor(foreground, accent, Color.urgent)
    : Style.normalBorderFor(foreground, accent, Color.urgent)

  activeFocusOnTab: true
  Accessible.role: Accessible.Button
  Accessible.name: label
  Accessible.description: hint

  Keys.onReturnPressed: root.triggered()
  Keys.onEnterPressed: root.triggered()
  Keys.onSpacePressed: root.triggered()

  RowLayout {
    anchors.fill: parent
    anchors.leftMargin: Style.space(10)
    anchors.rightMargin: Style.space(10)
    spacing: Style.space(9)

    Text {
      text: root.icon
      color: root.accent
      font.family: Style.font.family
      font.pixelSize: root.prominent
        ? Style.font.title
        : (root.compact ? Style.font.body : Style.font.subtitle)
      Layout.alignment: Qt.AlignVCenter
    }

    ColumnLayout {
      Layout.fillWidth: true
      Layout.alignment: Qt.AlignVCenter
      spacing: 1

      Text {
        Layout.fillWidth: true
        text: root.label
        color: root.foreground
        font.family: Style.font.family
        font.pixelSize: root.prominent
          ? Style.font.subtitle
          : (root.compact ? Style.font.bodySmall : Style.font.body)
        font.bold: true
        elide: Text.ElideRight
        textFormat: Text.PlainText
      }

      Text {
        Layout.fillWidth: true
        visible: !root.compact && root.hint !== ""
        text: root.hint
        color: root.foreground
        opacity: 0.62
        font.family: Style.font.family
        font.pixelSize: Style.font.caption
        elide: Text.ElideRight
        textFormat: Text.PlainText
      }
    }
  }

  MouseArea {
    id: mouse
    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    onClicked: {
      root.forceActiveFocus()
      root.triggered()
    }
  }
}
