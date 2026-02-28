#!/usr/bin/env python3
"""
Cards Against Maya - CSV & Deck Generator

Reads the batch text files and produces:
  1. cards_against_maya.csv           — master CSV (Type, CardText)
  2. cah_generator/black.txt          — prompt cards for github.com/GrantBirki/cah-generator
  3. cah_generator/white.txt          — response cards for the same tool
  4. printable_cards/                  — individual PNG card images (if Pillow is installed)

Usage:
    python3 make_deck.py                 # CSV + text files only
    python3 make_deck.py --images        # also generate PNG card images
"""

import csv
import os
import re
import sys
import textwrap
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
PROMPT_FILES = sorted(BASE_DIR.glob("prompts_batch*.txt"))
RESPONSE_FILES = sorted(BASE_DIR.glob("responses_batch*.txt"))

CSV_OUT = BASE_DIR / "cards_against_maya.csv"
CAH_DIR = BASE_DIR / "cah_generator"
IMG_DIR = BASE_DIR / "printable_cards"

# Card dimensions (2.5 x 3.5 inches at 300 DPI)
CARD_W, CARD_H = 750, 1050
MARGIN = 60
FONT_SIZE = 32
SMALL_FONT_SIZE = 18


# ── Helpers ────────────────────────────────────────────────────────────────────
def read_cards(files: list[Path]) -> list[str]:
    """Read card lines from batch files, strip numbering prefix."""
    cards = []
    for f in files:
        with open(f, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                # Strip leading number + dot:  "42. Card text" → "Card text"
                text = re.sub(r"^\d+\.\s*", "", line)
                if text:
                    cards.append(text)
    return cards


def write_csv(prompts: list[str], responses: list[str], path: Path):
    """Write master CSV with Type and CardText columns."""
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Type", "CardText"])
        for card in prompts:
            w.writerow(["Prompt", card])
        for card in responses:
            w.writerow(["Response", card])
    print(f"  CSV written: {path}  ({len(prompts)} prompts + {len(responses)} responses)")


def write_cah_generator_files(prompts: list[str], responses: list[str], out_dir: Path):
    """Write black.txt / white.txt for github.com/GrantBirki/cah-generator."""
    out_dir.mkdir(parents=True, exist_ok=True)

    info = out_dir / "info.txt"
    info.write_text("Cards Against Maya\nv1.0\n", encoding="utf-8")

    black = out_dir / "black.txt"
    black.write_text("\n".join(prompts) + "\n", encoding="utf-8")

    white = out_dir / "white.txt"
    white.write_text("\n".join(responses) + "\n", encoding="utf-8")

    print(f"  cah-generator files written to: {out_dir}/")


def generate_card_images(prompts: list[str], responses: list[str], out_dir: Path):
    """Generate individual PNG card images using Pillow."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("\n  ⚠ Pillow not installed. Run:  pip install Pillow")
        print("    Skipping image generation.\n")
        return

    out_dir.mkdir(parents=True, exist_ok=True)
    black_dir = out_dir / "prompts"
    white_dir = out_dir / "responses"
    black_dir.mkdir(exist_ok=True)
    white_dir.mkdir(exist_ok=True)

    # Try to load a good font, fall back to default
    font = None
    bold_font = None
    for font_path in [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSText.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]:
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, FONT_SIZE)
                bold_font = ImageFont.truetype(font_path, SMALL_FONT_SIZE)
                break
            except Exception:
                continue
    if font is None:
        font = ImageFont.load_default()
        bold_font = font

    def make_card(text: str, bg_color: str, fg_color: str, path: Path):
        img = Image.new("RGB", (CARD_W, CARD_H), bg_color)
        draw = ImageDraw.Draw(img)

        # Word-wrap the text
        wrapped = textwrap.fill(text, width=30)
        draw.multiline_text(
            (MARGIN, MARGIN),
            wrapped,
            fill=fg_color,
            font=font,
            spacing=8,
        )

        # Footer
        draw.text(
            (MARGIN, CARD_H - MARGIN - 20),
            "Cards Against Maya",
            fill=fg_color,
            font=bold_font,
        )

        img.save(path, "PNG")

    print(f"  Generating {len(prompts)} prompt card images...")
    for i, card in enumerate(prompts, 1):
        make_card(card, "#000000", "#FFFFFF", black_dir / f"prompt_{i:03d}.png")

    print(f"  Generating {len(responses)} response card images...")
    for i, card in enumerate(responses, 1):
        make_card(card, "#FFFFFF", "#000000", white_dir / f"response_{i:03d}.png")

    print(f"  Card images saved to: {out_dir}/")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("\n=== Cards Against Maya - Deck Generator ===\n")

    if not PROMPT_FILES:
        print("ERROR: No prompts_batch*.txt files found in", BASE_DIR)
        sys.exit(1)
    if not RESPONSE_FILES:
        print("ERROR: No responses_batch*.txt files found in", BASE_DIR)
        sys.exit(1)

    prompts = read_cards(PROMPT_FILES)
    responses = read_cards(RESPONSE_FILES)
    print(f"  Loaded {len(prompts)} prompt cards from {len(PROMPT_FILES)} files")
    print(f"  Loaded {len(responses)} response cards from {len(RESPONSE_FILES)} files")
    print()

    # 1. Master CSV
    write_csv(prompts, responses, CSV_OUT)

    # 2. cah-generator format (black.txt + white.txt)
    write_cah_generator_files(prompts, responses, CAH_DIR)

    # 3. Optional: PNG images
    if "--images" in sys.argv:
        print()
        generate_card_images(prompts, responses, IMG_DIR)

    print(f"\n=== Done! Total: {len(prompts) + len(responses)} cards ===")
    print()
    print("Next steps to print your deck:")
    print("  Option A: Use github.com/GrantBirki/cah-generator")
    print(f"            Copy {CAH_DIR}/ into the repo's cards/deck_1/ folder")
    print("            Run: script/deck --deck=1")
    print()
    print("  Option B: Use mywastedlife.com/CAH/")
    print("            Paste up to 30 cards at a time, generates 1200dpi PNGs")
    print("            Send PNGs to MakePlayingCards.com for printing")
    print()
    print("  Option C: Run this script with --images flag:")
    print("            python3 make_deck.py --images")
    print("            Then upload PNGs to MakePlayingCards.com")
    print()


if __name__ == "__main__":
    main()
