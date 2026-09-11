# Capture Board

Capture Board is a region-first screenshot and clipboard widget for the
Omarchy Quattro bar. Its primary action takes one click: select an area of the
screen and the image is copied, ready to paste.

![Capture Board compact panel](preview.png)

<details>
<summary>See every secondary action</summary>

![Capture Board expanded panel](screenshots/expanded.png)

</details>

## Features

- One-click region selection directly from the bar
- Region capture to clipboard, editor, or file
- Smart, window, and fullscreen screenshots
- Terminal-aware copy, cut, and paste shortcuts
- Plain-text paste, clipboard history, and LocalSend sharing
- OCR text capture, QR decoding, and colour picking
- Keyboard-accessible panel controls

## Install

```sh
omarchy plugin add https://github.com/3EYE3Y3/omarchy-capture-board.git --enable
```

The widget is placed in the left bar section by default.

## Use

| Action | Result |
| --- | --- |
| Left-click the capture icon | Select a region and copy it immediately |
| Right-click the capture icon | Open the compact Capture Board panel |
| Select region and copy | Start the same primary region-copy flow |
| Edit region | Select, annotate, save, and copy a region |
| Save region | Select a region and save it without opening the editor |
| More actions | Reveal other screenshot, clipboard, and extraction tools |

The panel can also be opened from a terminal:

```sh
omarchy-shell io.github.3eye3y3.capture-board open
```

Start region copy directly through shell IPC:

```sh
omarchy-shell io.github.3eye3y3.capture-board capture
```

Press `Escape` to close the panel. Controls can be reached with `Tab` and
activated with `Enter` or `Space`.

## Move the widget

```sh
omarchy bar move io.github.3eye3y3.capture-board --section left
```

Replace `left` with `center` or `right` to use another section.

## Dependencies and permissions

Capture Board targets Omarchy Quattro and uses commands included with a normal
Omarchy installation: `omarchy`, `omarchy-shell`, `hyprctl`, `wl-paste`, and
`hyprpicker`.

- The **Share** action uses LocalSend through `omarchy share clipboard`.
- Screenshot and extraction actions use Omarchy's existing capture commands.
- The plugin installs no packages, services, hooks, or privileged policies.
- It requests no elevated permissions and does not overwrite user configuration.
- Network access occurs only when the user explicitly chooses **Share**.

## Remove

```sh
omarchy plugin remove io.github.3eye3y3.capture-board
```

## License

[MIT](LICENSE)
