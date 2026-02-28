#!/usr/bin/env python3
"""
Cards Against Maya — Card Scorer & Selector

Reads scored JSON batch files, computes weighted scores, and selects
the top 102 prompts + 510 responses (612 total) for the final deck.

Usage:
    python3 score_cards.py

Inputs:
    scores/batch_*.json  — JSON arrays of scored cards from LLM batches

Outputs:
    cards_against_maya_top612.csv — curated 612-card CSV
"""

import csv
import json
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent
SCORES_DIR = BASE_DIR / "scores"
INPUT_CSV = BASE_DIR / "cards_against_maya.csv"
OUTPUT_CSV = BASE_DIR / "cards_against_maya_top612.csv"

# Rubric weights
WEIGHTS = {
    "humor": 0.30,
    "appropriateness": 0.20,
    "versatility": 0.20,
    "cultural_relevance": 0.15,
    "specificity": 0.10,
    "originality": 0.05,
}

# Target counts
TARGET_PROMPTS = 102
TARGET_RESPONSES = 510
TARGET_TOTAL = TARGET_PROMPTS + TARGET_RESPONSES

DIMENSIONS = ["humor", "appropriateness", "versatility", "cultural_relevance", "specificity", "originality"]


def compute_weighted_score(card: dict) -> float:
    """Compute the weighted score for a card."""
    return sum(card[dim] * WEIGHTS[dim] for dim in DIMENSIONS)


def load_scores() -> list[dict]:
    """Load all scored cards from JSON batch files in scores/ directory."""
    all_cards = []
    if not SCORES_DIR.exists():
        print(f"ERROR: {SCORES_DIR} directory not found.")
        print("Create the scores/ directory and place batch JSON files there.")
        sys.exit(1)

    json_files = sorted(SCORES_DIR.glob("batch_*.json"))
    if not json_files:
        print(f"ERROR: No batch_*.json files found in {SCORES_DIR}/")
        sys.exit(1)

    for jf in json_files:
        print(f"  Loading {jf.name}...")
        with open(jf, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            print(f"  WARNING: {jf.name} is not a JSON array, skipping.")
            continue
        for card in data:
            # Validate required fields
            missing = [d for d in DIMENSIONS if d not in card]
            if missing:
                print(f"  WARNING: Card missing dimensions {missing}: {card.get('card_text', '?')[:50]}")
                continue
            if "card_text" not in card or "type" not in card:
                print(f"  WARNING: Card missing card_text or type, skipping.")
                continue
            card["weighted_score"] = compute_weighted_score(card)
            all_cards.append(card)

    return all_cards


def load_original_csv() -> dict[str, str]:
    """Load original CSV to get canonical card texts and types."""
    cards = {}
    with open(INPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cards[row["CardText"].strip()] = row["Type"]
    return cards


def select_top_cards(all_cards: list[dict]) -> tuple[list[dict], list[dict]]:
    """Separate into prompts/responses, sort by score, select top N."""
    prompts = [c for c in all_cards if c["type"] == "Prompt"]
    responses = [c for c in all_cards if c["type"] == "Response"]

    # Sort by weighted score descending
    prompts.sort(key=lambda c: c["weighted_score"], reverse=True)
    responses.sort(key=lambda c: c["weighted_score"], reverse=True)

    top_prompts = prompts[:TARGET_PROMPTS]
    top_responses = responses[:TARGET_RESPONSES]

    return top_prompts, top_responses


def print_stats(all_cards, top_prompts, top_responses):
    """Print scoring statistics."""
    prompts = [c for c in all_cards if c["type"] == "Prompt"]
    responses = [c for c in all_cards if c["type"] == "Response"]

    print(f"\n{'='*60}")
    print(f"SCORING STATISTICS")
    print(f"{'='*60}")
    print(f"\n  Total cards scored: {len(all_cards)}")
    print(f"    Prompts:  {len(prompts)}")
    print(f"    Responses: {len(responses)}")

    print(f"\n  Selected for final deck:")
    print(f"    Prompts:  {len(top_prompts)} / {len(prompts)} (cut {len(prompts) - len(top_prompts)})")
    print(f"    Responses: {len(top_responses)} / {len(responses)} (cut {len(responses) - len(top_responses)})")
    print(f"    Total:    {len(top_prompts) + len(top_responses)}")

    # Score distribution
    for label, cards in [("Prompts", prompts), ("Responses", responses)]:
        scores = [c["weighted_score"] for c in cards]
        scores.sort(reverse=True)
        print(f"\n  {label} score distribution:")
        print(f"    Max:    {scores[0]:.2f}")
        print(f"    Top 25%: {scores[len(scores)//4]:.2f}")
        print(f"    Median: {scores[len(scores)//2]:.2f}")
        print(f"    Bot 25%: {scores[3*len(scores)//4]:.2f}")
        print(f"    Min:    {scores[-1]:.2f}")

    # Cutoff scores
    if len(top_prompts) > 0:
        print(f"\n  Prompt cutoff score: {top_prompts[-1]['weighted_score']:.2f}")
        print(f"    Lowest kept:  \"{top_prompts[-1]['card_text'][:60]}...\"")
    if len(top_responses) > 0:
        print(f"\n  Response cutoff score: {top_responses[-1]['weighted_score']:.2f}")
        print(f"    Lowest kept:  \"{top_responses[-1]['card_text'][:60]}...\"")

    # Dimension averages for kept cards
    print(f"\n  Average dimension scores (kept cards):")
    kept = top_prompts + top_responses
    for dim in DIMENSIONS:
        avg = sum(c[dim] for c in kept) / len(kept)
        print(f"    {dim:20s}: {avg:.2f}")

    # Show some cut cards that were close
    cut_prompts = [c for c in prompts if c not in top_prompts]
    cut_responses = [c for c in responses if c not in top_responses]

    if cut_prompts:
        print(f"\n  Top 5 cut prompts (just missed the cut):")
        for c in cut_prompts[:5]:
            print(f"    [{c['weighted_score']:.2f}] {c['card_text'][:70]}")

    if cut_responses:
        print(f"\n  Top 5 cut responses (just missed the cut):")
        for c in cut_responses[:5]:
            print(f"    [{c['weighted_score']:.2f}] {c['card_text'][:70]}")


def write_output(top_prompts, top_responses):
    """Write the final curated CSV."""
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Type", "CardText"])
        for card in top_prompts:
            writer.writerow(["Prompt", card["card_text"]])
        for card in top_responses:
            writer.writerow(["Response", card["card_text"]])

    print(f"\n  Output written to: {OUTPUT_CSV}")
    print(f"  Total cards: {len(top_prompts) + len(top_responses)}")


def main():
    print("\n=== Cards Against Maya — Card Scorer & Selector ===\n")

    # Load scores
    print("Loading scored batches...")
    all_cards = load_scores()
    print(f"  Loaded {len(all_cards)} scored cards.\n")

    # Select top cards
    print("Selecting top cards...")
    top_prompts, top_responses = select_top_cards(all_cards)

    # Print stats
    print_stats(all_cards, top_prompts, top_responses)

    # Write output
    write_output(top_prompts, top_responses)

    print(f"\n{'='*60}")
    print(f"Done! Run generate_cards.py to create card images.")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
