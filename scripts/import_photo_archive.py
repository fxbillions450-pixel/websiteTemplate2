"""Import the supplied photo ZIP into deployment-friendly portfolio assets."""

from __future__ import annotations

import argparse
import io
import json
import unicodedata
import zipfile
from pathlib import Path

from PIL import Image, ImageOps


PROJECTS = {
    "5e soirées de louange Sandra": {
        "slug": "5e-soirees-de-louange-sandra",
        "title": "5e soirées de louange Sandra",
        "palette": ["#3d2a24", "#d6a46f"],
    },
    "6e soirée de Louanges Sandra": {
        "slug": "6e-soiree-de-louanges-sandra",
        "title": "6e soirée de Louanges Sandra",
        "palette": ["#332e35", "#c6a9bd"],
    },
    "7e Soirée de Louange Sandra": {
        "slug": "7e-soiree-de-louange-sandra",
        "title": "7e Soirée de Louange Sandra",
        "palette": ["#1e3037", "#9eb9bc"],
    },
    "Masterclass Festival Gospel 2026": {
        "slug": "masterclass-festival-gospel-2026",
        "title": "Masterclass Festival Gospel 2026",
        "palette": ["#423223", "#d1b071"],
    },
}


def normalized(value: str) -> str:
    return unicodedata.normalize("NFC", value)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    assets = root / "public" / "assets" / "projects"
    assets.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []

    with zipfile.ZipFile(args.archive) as archive:
        entries = [
            info
            for info in archive.infolist()
            if not info.is_dir() and Path(info.filename).suffix.lower() in {".jpg", ".jpeg"}
        ]
        processed = 0
        for folder, project in PROJECTS.items():
            destination = assets / str(project["slug"])
            destination.mkdir(parents=True, exist_ok=True)
            matches = [info for info in entries if normalized(info.filename.split("/")[0]) == normalized(folder)]
            images: list[dict[str, str]] = []
            for index, info in enumerate(matches, start=1):
                filename = f"{index:02d}.jpg"
                target = destination / filename
                with archive.open(info) as source, Image.open(io.BytesIO(source.read())) as opened:
                    image = ImageOps.exif_transpose(opened).convert("RGB")
                    image.thumbnail((2400, 2400), Image.Resampling.LANCZOS, reducing_gap=3)
                    image.save(target, "JPEG", quality=84, optimize=True, progressive=True)
                images.append({
                    "src": f"/assets/projects/{project['slug']}/{filename}",
                    "name": Path(info.filename).stem,
                })
                processed += 1
                print(f"[{processed}/{len(entries)}] {folder} / {Path(info.filename).name}")
            manifest.append({**project, "images": images})

    (root / "data" / "photo-projects.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Imported {processed} images into {assets}")


if __name__ == "__main__":
    main()
