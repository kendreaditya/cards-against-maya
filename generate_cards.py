#!/usr/bin/env python3
"""
Cards Against Maya — Card Image Generator

Generates print-ready PNG card images using the cah-generator templates.
Output is ready to upload to MakePlayingCards.com.

Usage:
    source venv/bin/activate
    python3 generate_cards.py                        # uses top612 curated deck
    python3 generate_cards.py cards_against_maya.csv  # uses specified CSV
"""

import csv
import os
import re
import sys
import zipfile
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
TEMPLATE_DIR = BASE_DIR / "cah-generator" / "generators" / "single-card-output" / "img"
FONT_DIR = BASE_DIR / "cah-generator" / "generators" / "single-card-output" / "fonts"
# Default to curated top-612 deck; accept CLI arg to override
CSV_FILE = Path(sys.argv[1]) if len(sys.argv) > 1 else BASE_DIR / "cards_against_maya_top612.csv"
OUTPUT_DIR = BASE_DIR / "printable_cards"

BLACK_TEMPLATE = TEMPLATE_DIR / "black.png"
WHITE_TEMPLATE = TEMPLATE_DIR / "white.png"

# ── Card Layout (3288x4488 template at 1200 DPI) ──────────────────────────────
CARD_W, CARD_H = 3288, 4488
TEXT_X = 444           # left margin for text
TEXT_Y = 444           # top margin for text
TEXT_WIDTH = 2400      # max text width in pixels
TEXT_HEIGHT = 2800     # max text height before we shrink font
FONT_SIZE_DEFAULT = 200  # larger base font size
FONT_SIZE_MIN = 110
LINE_SPACING = 75        # increased line spacing

# Logo / footer area
GAME_NAME = "Cards Against Maya"
LOGO_FONT_SIZE = 100
LOGO_SMALL_FONT_SIZE = 70
# Region to blank out the old "Cards Against Humanity" logo on templates
LOGO_COVER_Y = 3700
LOGO_COVER_H = 788      # covers from LOGO_COVER_Y to bottom of card (minus border)
LOGO_TEXT_Y = 3850       # where to draw new logo text
LOGO_ICON_SIZE = 140     # size of the card icon next to logo


def get_font(size: int) -> ImageFont.FreeTypeFont:
    """Load the best available font."""
    nimbus = FONT_DIR / "NimbusSanL-Bol.otf"
    if nimbus.exists():
        return ImageFont.truetype(str(nimbus), size)
    for p in ["/System/Library/Fonts/Helvetica.ttc",
              "/System/Library/Fonts/HelveticaNeue.ttc"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> str:
    """Word-wrap text to fit within max_width pixels."""
    words = text.split()
    lines = []
    current_line = ""
    tmp = Image.new("RGB", (1, 1))
    draw = ImageDraw.Draw(tmp)

    for word in words:
        test = f"{current_line} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line = test
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)
    return "\n".join(lines)


def pick_font_size(text: str, max_width: int, max_height: int) -> int:
    """Pick a font size that fits the text in the available area."""
    tmp = Image.new("RGB", (1, 1))
    draw = ImageDraw.Draw(tmp)

    for size in range(FONT_SIZE_DEFAULT, FONT_SIZE_MIN - 1, -5):
        font = get_font(size)
        wrapped = wrap_text(text, font, max_width)
        bbox = draw.multiline_textbbox((0, 0), wrapped, font=font, spacing=LINE_SPACING)
        h = bbox[3] - bbox[1]
        if h <= max_height:
            return size
    return FONT_SIZE_MIN


def rebrand_template(template_path: Path, bg_color: str, fg_color: str) -> Image.Image:
    """Load template image, cover old logo, draw 'Cards Against Maya' logo."""
    img = Image.open(template_path).copy()
    draw = ImageDraw.Draw(img)

    # Cover the old "Cards Against Humanity" logo area with bg color
    draw.rectangle(
        [(TEXT_X - 50, LOGO_COVER_Y), (CARD_W - 200, CARD_H - 200)],
        fill=bg_color,
    )

    # Draw small card-stack icon (simple rectangles)
    icon_x, icon_y = TEXT_X, LOGO_TEXT_Y - 20
    # Back card (offset)
    draw.rectangle(
        [(icon_x + 15, icon_y + 10), (icon_x + LOGO_ICON_SIZE - 15, icon_y + LOGO_ICON_SIZE + 10)],
        fill=fg_color, outline=fg_color, width=3,
    )
    # Front card
    inner_fill = bg_color if fg_color == "white" else "white"
    draw.rectangle(
        [(icon_x, icon_y), (icon_x + LOGO_ICON_SIZE - 30, icon_y + LOGO_ICON_SIZE)],
        fill=inner_fill, outline=fg_color, width=4,
    )

    # Draw "Cards Against Maya" text next to icon
    logo_font = get_font(LOGO_FONT_SIZE)
    draw.text(
        (icon_x + LOGO_ICON_SIZE + 30, LOGO_TEXT_Y),
        GAME_NAME,
        fill=fg_color,
        font=logo_font,
    )

    return img


def generate_card(text: str, template_img: Image.Image, output_path: Path, fill_color: str):
    """Generate a single card image from a pre-rebranded template."""
    img = template_img.copy()
    draw = ImageDraw.Draw(img)

    # Pick font size and wrap
    font_size = pick_font_size(text, TEXT_WIDTH, TEXT_HEIGHT)
    font = get_font(font_size)
    wrapped = wrap_text(text, font, TEXT_WIDTH)

    # Draw card text
    draw.multiline_text(
        (TEXT_X, TEXT_Y),
        wrapped,
        fill=fill_color,
        font=font,
        spacing=LINE_SPACING,
    )

    img.save(output_path, "PNG")


def generate_back(bg_color: str, fg_color: str, output_path: Path):
    """Generate a card back image with 'Cards Against Maya' branding."""
    img = Image.new("RGB", (CARD_W, CARD_H), bg_color)
    draw = ImageDraw.Draw(img)

    # Draw "Cards Against Maya" left-aligned, large text
    title_lines = ["Cards", "Against", "Maya"]
    title_font = get_font(500)
    x = TEXT_X
    y = 400
    for line in title_lines:
        draw.text((x, y), line, fill=fg_color, font=title_font)
        y += 580

    img.save(output_path, "PNG")


def main():
    print("\n=== Cards Against Maya — Card Image Generator ===\n")

    if not CSV_FILE.exists():
        print(f"ERROR: {CSV_FILE} not found. Run make_deck.py first.")
        return
    if not BLACK_TEMPLATE.exists():
        print(f"ERROR: Template not found at {BLACK_TEMPLATE}")
        return

    # Read CSV
    prompts = []
    responses = []
    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["Type"] == "Prompt":
                prompts.append(row["CardText"])
            else:
                responses.append(row["CardText"])

    print(f"  Loaded {len(prompts)} prompts, {len(responses)} responses\n")

    # Create output dirs
    prompt_dir = OUTPUT_DIR / "prompts_black"
    response_dir = OUTPUT_DIR / "responses_white"
    backs_dir = OUTPUT_DIR / "backs"
    prompt_dir.mkdir(parents=True, exist_ok=True)
    response_dir.mkdir(parents=True, exist_ok=True)
    backs_dir.mkdir(parents=True, exist_ok=True)

    # Generate rebranded card backs
    print("  Generating card backs...")
    generate_back("black", "white", backs_dir / "back_black.png")
    generate_back("white", "black", backs_dir / "back_white.png")
    print("  Card backs saved to backs/\n")

    # Pre-rebrand templates (do it once, reuse for all cards)
    print("  Preparing rebranded templates...")
    black_tmpl = rebrand_template(BLACK_TEMPLATE, "black", "white")
    white_tmpl = rebrand_template(WHITE_TEMPLATE, "white", "black")

    # Generate prompt cards (black background, white text)
    print(f"  Generating {len(prompts)} prompt cards (black)...")
    for i, text in enumerate(prompts, 1):
        out = prompt_dir / f"prompt_{i:03d}.png"
        generate_card(text, black_tmpl, out, "white")
        if i % 25 == 0 or i == len(prompts):
            print(f"    {i}/{len(prompts)}")

    # Generate response cards (white background, black text)
    print(f"\n  Generating {len(responses)} response cards (white)...")
    for i, text in enumerate(responses, 1):
        out = response_dir / f"response_{i:03d}.png"
        generate_card(text, white_tmpl, out, "black")
        if i % 50 == 0 or i == len(responses):
            print(f"    {i}/{len(responses)}")

    # Create ZIP
    zip_path = OUTPUT_DIR / "cards_against_maya_deck.zip"
    print(f"\n  Creating ZIP file...")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for folder in [prompt_dir, response_dir, backs_dir]:
            for png in sorted(folder.glob("*.png")):
                zf.write(png, f"{folder.name}/{png.name}")

    total = len(prompts) + len(responses)
    print(f"\n=== Done! {total} card images generated ===")
    print(f"\n  Card images: {OUTPUT_DIR}/")
    print(f"  ZIP file:    {zip_path}")
    print()


if __name__ == "__main__":
    main()
