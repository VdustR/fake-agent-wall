"""Regenerate desktop icons from the committed SVG masters.

Requires ImageMagick (`magick`) and macOS `iconutil`. Run from any directory.
"""

from pathlib import Path
from copy import deepcopy
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)


def template_sources(master: Path, playing: bool) -> tuple[ET.Element, ET.Element]:
    """Preserve the app mark's geometry and cut its prompt out of the alpha."""
    source = ET.parse(master).getroot()
    sessions = source.find(f"{{{SVG}}}g[@id='sessions']")
    prompt = source.find(f"{{{SVG}}}path[@id='prompt']")
    if sessions is None or prompt is None:
        raise ValueError("The app master must contain sessions and a prompt")

    attributes = {"width": "16", "height": "16", "viewBox": "31 31 194 194"}
    template = ET.Element(f"{{{SVG}}}svg", attributes)
    title = ET.SubElement(template, f"{{{SVG}}}title")
    title.text = f"Fake Agent Wall — {'playing' if playing else 'idle'}"
    definitions = ET.SubElement(template, f"{{{SVG}}}defs")
    mask = ET.SubElement(definitions, f"{{{SVG}}}mask", {
        "id": "prompt-cutout", "maskUnits": "userSpaceOnUse",
        "x": "0", "y": "0", "width": "256", "height": "256",
    })
    ET.SubElement(mask, f"{{{SVG}}}rect", {
        "width": "256", "height": "256", "fill": "#fff",
    })
    cutout = deepcopy(prompt)
    cutout.set("stroke", "#000")
    mask.append(cutout)

    # ImageMagick's SVG mask rendering differs from browsers. Render an opaque
    # luminance plate and copy its intensity into PNG alpha instead.
    coverage = ET.Element(f"{{{SVG}}}svg", {
        **attributes, "width": "256", "height": "256",
    })
    for document, color in ((template, "#000"), (coverage, "#fff")):
        panes = deepcopy(sessions)
        for pane in panes:
            pane.set("fill", color)
            if pane.get("id") != "lead" and not playing:
                pane.set("fill-opacity", "0.65")
        if document is template:
            panes.set("mask", "url(#prompt-cutout)")
        document.append(panes)
    coverage.append(deepcopy(cutout))
    return template, coverage


def render_template(coverage: Path, destination: Path, size: int) -> None:
    subprocess.run([
        "magick", "-size", f"{size}x{size}", "xc:black", "(",
        "-size", "256x256", "-background", "black", str(coverage), "-alpha", "remove",
        "-alpha", "off", "-colorspace", "gray", "-resize", f"{size}x{size}",
        ")", "-compose", "CopyOpacity", "-composite", "-strip",
        f"PNG32:{destination}",
    ], check=True)


def render(source: Path, destination: Path, size: int) -> None:
    subprocess.run(
        [
            "magick", "-background", "none", str(source), "-resize",
            f"{size}x{size}", "-strip", f"PNG32:{destination}",
        ],
        check=True,
    )


def main() -> None:
    for tool in ("magick", "iconutil"):
        if not shutil.which(tool):
            raise SystemExit(f"Required tool is unavailable: {tool}")

    master = ROOT / "build/icon.svg"
    render(master, ROOT / "build/icon.png", 1024)
    assets = ROOT / "desktop/assets"
    with tempfile.TemporaryDirectory(prefix="fake-agent-wall-tray-") as directory:
        coverage_path = Path(directory) / "coverage.svg"
        for name, playing in (("trayTemplate", False), ("trayPlayingTemplate", True)):
            template, coverage = template_sources(master, playing)
            for element in (template, coverage):
                ET.indent(element)
            ET.ElementTree(template).write(assets / f"{name}.svg", encoding="unicode")
            ET.ElementTree(coverage).write(coverage_path, encoding="unicode")
            for suffix, size in (("", 16), ("@2x", 32)):
                render_template(coverage_path, assets / f"{name}{suffix}.png", size)
    for suffix, size in (("", 32), ("@2x", 64)):
        render(master, assets / f"tray{suffix}.png", size)

    with tempfile.TemporaryDirectory(prefix="fake-agent-wall-icons-") as directory:
        iconset = Path(directory) / "icon.iconset"
        iconset.mkdir()
        for size in (16, 32, 128, 256, 512):
            render(master, iconset / f"icon_{size}x{size}.png", size)
            render(master, iconset / f"icon_{size}x{size}@2x.png", size * 2)
        subprocess.run(
            ["iconutil", "-c", "icns", str(iconset), "-o", str(ROOT / "build/icon.icns")],
            check=True,
        )
    print("Generated application icons and tray icons from the SVG masters.")


if __name__ == "__main__":
    main()
