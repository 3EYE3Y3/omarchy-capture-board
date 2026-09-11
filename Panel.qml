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
  // "main" | "moreCaptures" | "settings" — swapped in place of the old
  // ever-growing "More actions" section, so only one view's content ever
  // counts toward the panel's height at a time.
  property string activeView: "main"
  readonly property string actionScript: Qt.resolvedUrl("bin/capture-board-action")
    .toString().replace(/^file:\/\//, "")

  onOpenedChanged: {
    if (!opened) activeView = "main"
    else convert.refresh()
  }

  ConversionService {
    id: convert
    onCaptureFinished: function(hasResults) { if (hasResults) root.open() }
  }

  function launch(action) {
    root.close()
    Quickshell.execDetached([root.actionScript, action])
  }

  // Region/OCR/colour close the panel the same way every other capture
  // action does (slurp/hyprpicker need the screen clear of it) but run as
  // a tracked process instead of a detached one, so ConversionService can
  // see the result and — via captureFinished above — bring the panel back
  // once there is something to show.
  function launchSmartRegion() {
    root.close()
    convert.captureRegionSmart()
  }

  function launchSmartOcr() {
    root.close()
    convert.captureOcrSmart()
  }

  function launchSmartColour() {
    root.close()
    convert.pickColourSmart()
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
    focusTarget: captureRegionTile
    contentWidth: panel.fittedContentWidth(Style.space(400))
    contentHeight: panel.fittedContentHeight(content.implicitHeight, Style.space(520))

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }

      // Bounded and scrollable: on a short/constrained screen
      // fittedContentHeight caps the panel below content.implicitHeight,
      // and without this the excess would just be clipped — buttons
      // silently unreachable rather than merely requiring a scroll.
      Flickable {
        id: scrollArea
        anchors.fill: parent
        contentWidth: width
        contentHeight: content.implicitHeight
        clip: true
        boundsBehavior: Flickable.StopAtBounds
        interactive: contentHeight > height

        ColumnLayout {
          id: content
          width: scrollArea.width
          spacing: Style.space(12)

          RowLayout {
            Layout.fillWidth: true
            visible: root.activeView === "main"
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
                text: "Capture Board"
                color: root.barForeground
                font.family: root.bar ? root.bar.fontFamily : Style.font.family
                font.pixelSize: Style.font.title
                font.bold: true
              }

              Text {
                text: "Capture something — useful conversions appear automatically"
                color: root.barForeground
                opacity: 0.6
                font.family: root.bar ? root.bar.fontFamily : Style.font.family
                font.pixelSize: Style.font.caption
                wrapMode: Text.WordWrap
              }
            }
          }

          SmartResultsSection {
            Layout.fillWidth: true
            visible: root.activeView === "main" && (convert.results.length > 0 || convert.analyzing)
            results: convert.results
            analyzing: convert.analyzing
            lastCopiedValue: convert.lastCopiedValue
            foreground: root.barForeground
            onCopyRequested: function(text) { convert.copyResult(text) }
          }

          ColumnLayout {
            Layout.fillWidth: true
            visible: root.activeView === "main"
            spacing: Style.space(10)

            Text {
              text: "CAPTURE"
              color: root.barForeground
              opacity: 0.58
              font.family: root.bar ? root.bar.fontFamily : Style.font.family
              font.pixelSize: Style.font.caption
              font.letterSpacing: 1.2
              font.bold: true
            }

            RowLayout {
              Layout.fillWidth: true
              spacing: Style.space(6)

              IconTile {
                id: captureRegionTile
                icon: "󰩬"
                label: "Region"
                hint: "Select a region, copy it, and detect any convertible values"
                foreground: root.barForeground
                onTriggered: root.launchSmartRegion()
              }

              IconTile {
                icon: "󰍹"
                label: "Screen"
                hint: "Copy the full screen"
                foreground: root.barForeground
                onTriggered: root.launch("shot-fullscreen-copy")
              }

              IconTile {
                icon: "󰴑"
                label: "OCR"
                hint: "Extract text from a region and detect convertible values"
                foreground: root.barForeground
                onTriggered: root.launchSmartOcr()
              }

              IconTile {
                icon: "󰐲"
                label: "QR"
                hint: "Decode a QR code"
                foreground: root.barForeground
                onTriggered: root.launch("qr")
              }

              IconTile {
                icon: "󰃉"
                label: "Colour"
                hint: "Pick a colour and detect its HEX/RGB/HSL values"
                foreground: root.barForeground
                onTriggered: root.launchSmartColour()
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

            RowLayout {
              Layout.fillWidth: true
              spacing: Style.space(6)

              IconTile {
                icon: "󰆏"
                label: "Copy"
                foreground: root.barForeground
                onTriggered: root.launch("copy")
              }

              IconTile {
                icon: "󰆐"
                label: "Cut"
                foreground: root.barForeground
                onTriggered: root.launch("cut")
              }

              IconTile {
                icon: "󰆒"
                label: "Paste"
                foreground: root.barForeground
                onTriggered: root.launch("paste")
              }
            }

            RowLayout {
              Layout.fillWidth: true
              spacing: Style.space(6)

              ActionButton {
                Layout.fillWidth: true
                compact: true
                icon: "󰅂"
                label: "More captures"
                foreground: root.barForeground
                onTriggered: root.activeView = "moreCaptures"
              }

              ActionButton {
                Layout.fillWidth: true
                compact: true
                icon: "󰒓"
                label: "Settings"
                foreground: root.barForeground
                onTriggered: root.activeView = "settings"
              }
            }
          }

          MoreCapturesView {
            Layout.fillWidth: true
            visible: root.activeView === "moreCaptures"
            foreground: root.barForeground
            onActionRequested: function(action) { root.launch(action) }
            onBackRequested: root.activeView = "main"
          }

          SettingsView {
            Layout.fillWidth: true
            visible: root.activeView === "settings"
            foreground: root.barForeground
            preferences: convert.preferences
            onPreferenceChanged: function(key, value) { convert.setPreference(key, value) }
            onBackRequested: root.activeView = "main"
          }
        }
      }
    }
  }
}
