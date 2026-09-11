import QtQuick
import Quickshell
import Quickshell.Io
import qs.Ui

BarWidget {
  id: root
  moduleName: "io.github.3eye3y3.capture-board"
  readonly property string actionScript: Qt.resolvedUrl("bin/capture-board-action")
    .toString().replace(/^file:\/\//, "")

  readonly property bool opened: panelLoader.item
    ? panelLoader.item.opened === true
    : false
  readonly property bool popoutSwitchClosing: panelLoader.item
    ? panelLoader.item.popoutSwitchClosing === true
    : false

  function open() {
    if (panelLoader.item) panelLoader.item.open()
  }

  function close() {
    if (panelLoader.item) panelLoader.item.close()
  }

  function togglePanel() {
    if (panelLoader.item) panelLoader.item.toggle()
  }

  function copyRegion() {
    close()
    Quickshell.execDetached([actionScript, "shot-region-copy"])
  }

  function closeForPopoutSwitch() {
    if (panelLoader.item) panelLoader.item.closeForPopoutSwitch()
  }

  function injectPanel() {
    var panel = panelLoader.item
    if (!panel) return
    panel.bar = root.bar
    panel.settings = root.settings
    panel.anchorItem = button
    panel.hostWidget = root
  }

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  onBarChanged: injectPanel()
  onSettingsChanged: injectPanel()

  Loader {
    id: panelLoader
    active: true
    source: Qt.resolvedUrl("Panel.qml")
    visible: false
    onLoaded: {
      root.injectPanel()
      Qt.callLater(root.injectPanel)
    }
  }

  IpcHandler {
    target: "io.github.3eye3y3.capture-board"

    function capture(): void { root.copyRegion() }
    function open(): void { root.open() }
    function close(): void { root.close() }
    function show(): void { root.open() }
    function hide(): void { root.close() }
    function toggle(): void { root.togglePanel() }
    function version(): string { return "1.1.0" }
  }

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: "󰩬"
    tooltipText: "Copy region · Right-click for more"

    onPressed: function(mouseButton) {
      if (mouseButton === Qt.LeftButton) root.copyRegion()
      else if (mouseButton === Qt.RightButton) root.togglePanel()
    }
  }
}
