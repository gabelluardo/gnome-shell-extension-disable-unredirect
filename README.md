# Disable Unredirect Fullscreen Windows

Disables GNOME Shell's fullscreen-window unredirect optimization. This avoids
the long-standing issue where clicks on a fullscreen window reach a window
underneath it, and can also prevent fullscreen tearing.

The extension supports GNOME Shell 48, 49, 50 and 51. It detects the
compositor API available at runtime, including the older
`*_unredirect_for_display()` variant.

## Install

### From extensions.gnome.org

Install and enable the published release from
[extensions.gnome.org](https://extensions.gnome.org/extension/1873/disable-unredirect-fullscreen-windows/).

### From source

Install the development prerequisites: Node.js, npm and
[just](https://github.com/casey/just). Then run:

```bash
npm install
just install
```

`just install` replaces the extension at
`~/.local/share/gnome-shell/extensions/unredirect@vaina.lt` and preserves the
same UUID as the published extension.

On Xorg, press <kbd>Alt</kbd>+<kbd>F2</kbd>, enter `r`, then press
<kbd>Enter</kbd> to reload GNOME Shell. On Wayland, log out and back in, or
disable and enable the extension again from the Extensions application.

## Development

```bash
npm install
just check
just build
just pack
```

`just check` runs Biome and the TypeScript typecheck. `just build` writes a
loadable extension to `_build`; `just pack` creates
`unredirect@vaina.lt.shell-extension.zip` for distribution. Run `just --list`
to view all recipes.

Source code lives in `src` and distributable static files in `resources`.
`_build` is generated and should not be edited.

## Hide Top Bar And Floating Docks

Hide Top Bar and floating dock extensions can update panel or dock geometry
while GNOME Shell processes fullscreen state. This extension patches only the
compositor's re-enable method, applies the initial disable once in the next
idle loop, and restores a method only when it still owns that wrapper. That
avoids repeatedly toggling unredirect and avoids overwriting a wrapper added
by another extension.

Enable all three extensions, then test fullscreen windows, overview entry and
exit, and workspace changes. If flickering remains, collect the GNOME Shell
log before reporting it:

```bash
journalctl -f /usr/bin/gnome-shell
```

An error such as `disable_unredirect_for_display is not a function` indicates
a mismatched compositor API in an older installed copy. Reinstall this version
with `just install`, reload GNOME Shell, and verify the error no longer
appears.

## License

This project is licensed under the GNU General Public License v3.0. See
[LICENSE](LICENSE).
