pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import Quickshell
import qs.Commons
import qs.Ui

Panel {
  id: root
  moduleName: "io.github.3eye3y3.capture-board"
  manageIpc: false

  property var anchorItem: null
  property var hostWidget: null
  property bool moreActionsVisible: false
  readonly property string actionScript: Qt.resolvedUrl("bin/capture-board-action")
    .toString().replace(/^file:\/\//, "")

  onOpenedChanged: {
    if (!opened) moreActionsVisible = false
  }

  function launch(action) {
    root.close()
    Quickshell.execDetached([root.actionScript, action])
  }

  function switchPanel(direction) {
    if (root.bar && typeof root.bar.switchPanelFrom === "function")
      return root.bar.switchPanelFrom(root.hostWidget || root, direction)
    return false
  }

  KeyboardPanel {
    id: panel
    anchorItem: root.anchorItem
    owner: root.hostWidget || root
    bar: root.bar
    open: root.opened
    focusTarget: copyRegionButton
    contentWidth: panel.fittedContentWidth(Style.space(430))
    contentHeight: panel.fittedContentHeight(content.implicitHeight)

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }

      ColumnLayout {
        id: content
        width: parent.width
        spacing: Style.space(12)

        RowLayout {
          Layout.fillWidth: true
          spacing: Style.space(10)

          Text {
            text: "󰩬"
            color: Color.accent
            font.family: root.bar ? root.bar.fontFamily : Style.font.family
            font.pixelSize: Style.font.displayLarge
          }

          ColumnLayout {
            Layout.fillWidth: true
            spacing: 1

            Text {
              text: "Capture region"
              color: root.barForeground
              font.family: root.bar ? root.bar.fontFamily : Style.font.family
              font.pixelSize: Style.font.title
              font.bold: true
            }

            Text {
              text: "Select an area and copy it to the clipboard"
              color: root.barForeground
              opacity: 0.65
              font.family: root.bar ? root.bar.fontFamily : Style.font.family
              font.pixelSize: Style.font.caption
            }
          }
        }

        ActionButton {
          id: copyRegionButton
          Layout.fillWidth: true
          prominent: true
          icon: "󰆏"
          label: "Select region and copy"
          hint: "Ready to paste immediately"
          foreground: root.barForeground
          onTriggered: root.launch("shot-region-copy")
        }

        RowLayout {
          Layout.fillWidth: true
          spacing: Style.space(7)

          ActionButton {
            Layout.fillWidth: true
            compact: true
            icon: "󰏫"
            label: "Edit region"
            foreground: root.barForeground
            onTriggered: root.launch("shot-region-edit")
          }

          ActionButton {
            Layout.fillWidth: true
            compact: true
            icon: "󰆓"
            label: "Save region"
            foreground: root.barForeground
            onTriggered: root.launch("shot-region-save")
          }
        }

        ActionButton {
          Layout.fillWidth: true
          compact: true
          icon: root.moreActionsVisible ? "󰅀" : "󰅂"
          label: root.moreActionsVisible ? "Fewer actions" : "More actions"
          hint: "Other capture and clipboard tools"
          foreground: root.barForeground
          onTriggered: root.moreActionsVisible = !root.moreActionsVisible
        }

        ColumnLayout {
          Layout.fillWidth: true
          visible: root.moreActionsVisible
          spacing: Style.space(10)

          Text {
            text: "OTHER SCREENSHOTS"
            color: root.barForeground
            opacity: 0.58
            font.family: root.bar ? root.bar.fontFamily : Style.font.family
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
              color: root.barForeground
              opacity: 0.56
              font.family: root.bar ? root.bar.fontFamily : Style.font.family
              font.pixelSize: Style.font.caption
              font.bold: true
              Layout.fillWidth: true
              horizontalAlignment: Text.AlignHCenter
            }
            Text {
              text: "COPY"
              color: root.barForeground
              opacity: 0.56
              font.family: root.bar ? root.bar.fontFamily : Style.font.family
              font.pixelSize: Style.font.caption
              font.bold: true
              Layout.fillWidth: true
              horizontalAlignment: Text.AlignHCenter
            }
            Text {
              text: "SAVE"
              color: root.barForeground
              opacity: 0.56
              font.family: root.bar ? root.bar.fontFamily : Style.font.family
              font.pixelSize: Style.font.caption
              font.bold: true
              Layout.fillWidth: true
              horizontalAlignment: Text.AlignHCenter
            }

            Repeater {
              model: [
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
                  color: root.barForeground
                  font.family: root.bar ? root.bar.fontFamily : Style.font.family
                  font.pixelSize: Style.font.bodySmall
                  font.bold: true
                }

                ActionButton {
                  Layout.fillWidth: true
                  compact: true
                  icon: "󰏫"
                  label: "Edit"
                  foreground: root.barForeground
                  onTriggered: root.launch("shot-" + screenshotRow.modelData.mode + "-edit")
                }

                ActionButton {
                  Layout.fillWidth: true
                  compact: true
                  icon: "󰆏"
                  label: "Copy"
                  foreground: root.barForeground
                  onTriggered: root.launch("shot-" + screenshotRow.modelData.mode + "-copy")
                }

                ActionButton {
                  Layout.fillWidth: true
                  compact: true
                  icon: "󰆓"
                  label: "Save"
                  foreground: root.barForeground
                  onTriggered: root.launch("shot-" + screenshotRow.modelData.mode + "-save")
                }
              }
            }
          }

          Text {
            text: "CLIPBOARD"
            color: root.barForeground
            opacity: 0.58
            font.family: root.bar ? root.bar.fontFamily : Style.font.family
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
                { action: "copy", label: "Copy", icon: "󰆏" },
                { action: "cut", label: "Cut", icon: "󰆐" },
                { action: "paste", label: "Paste", icon: "󰆒" },
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
                foreground: root.barForeground
                onTriggered: root.launch(modelData.action)
              }
            }
          }

          Text {
            text: "EXTRACT"
            color: root.barForeground
            opacity: 0.58
            font.family: root.bar ? root.bar.fontFamily : Style.font.family
            font.pixelSize: Style.font.caption
            font.letterSpacing: 1.2
            font.bold: true
          }

          RowLayout {
            Layout.fillWidth: true
            spacing: Style.space(7)

            Repeater {
              model: [
                { action: "ocr", label: "Text", icon: "󰴑" },
                { action: "qr", label: "QR code", icon: "󰐲" },
                { action: "colour", label: "Colour", icon: "󰃉" }
              ]

              delegate: ActionButton {
                required property var modelData
                Layout.fillWidth: true
                compact: true
                icon: modelData.icon
                label: modelData.label
                foreground: root.barForeground
                onTriggered: root.launch(modelData.action)
              }
            }
          }
        }

        Text {
          Layout.fillWidth: true
          text: "Left-click the bar icon anytime for instant region copy"
          color: root.barForeground
          opacity: 0.5
          font.family: root.bar ? root.bar.fontFamily : Style.font.family
          font.pixelSize: Style.font.caption
          horizontalAlignment: Text.AlignHCenter
        }
      }
    }
  }
}
