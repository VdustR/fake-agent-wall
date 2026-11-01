# tools

`claude-code-spinner-verbs.txt` is the historical raw `strings` source for the
activity-verb corpus, filtered to present-participle words. It is the source
`src/lib/verbs.ts` was generated from.
Kept for provenance; nothing at runtime reads it.

## Desktop icons

The approved **Bold** design is maintained in `build/icon.svg`. The monochrome
16 px idle and playing SVGs and PNGs in `desktop/assets` are generated from the
same pane and prompt geometry. Both states retain the `>_` cutout; the three
source panes change from 65% opacity when idle to full opacity while playing.
The tray omits the app tile background and crops its padding for small sizes.
macOS supplies the menu bar color through Electron's template-image support.
Windows and Linux use the colored application mark for the tray.

On macOS, with ImageMagick installed, regenerate the PNG and ICNS exports:

```sh
python3 tools/generate-icons.py
```

The script finishes all exports before returning. It preserves the existing
16/32 px template and 32/64 px colored-tray size pairs. Generated iconset files
are temporary and are removed when ICNS generation completes or fails.

Keep the prompt's explicit `stroke-opacity="1"`: ImageMagick's SVG renderer
on the export machine otherwise omitted the stroke despite a successful exit.
The template SVGs use a mask for the transparent prompt. PNG export uses an
equivalent luminance plate because the installed ImageMagick SVG renderer did
not preserve that mask correctly.
