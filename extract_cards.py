#!/usr/bin/env python3
"""
Extract unique Prompt and Response cards from the CAH Family Edition CSV.

The CSV has two independent sections:
  - Left section:  col[0] = card type ("Prompt"/"Response"), col[1] = card text
  - Right section:  col[11] = card type ("Prompt"/"Response"), col[12] = card text

Cards may contain embedded newlines (handled by Python's csv module).
We collect unique card texts across both sections.
"""

import csv
import os

CSV_PATH = "/Users/kendreaditya/Downloads/cards-against-humanity/A Different CAH spreadsheet - CAH Family Edition.csv"
OUT_DIR = "/Users/kendreaditya/Downloads/cards-against-humanity"

prompts = set()
responses = set()

with open(CSV_PATH, "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        # Left section: columns 0-1
        if len(row) > 1 and row[0].strip() in ("Prompt", "Response"):
            text = row[1].strip()
            if text:
                if row[0].strip() == "Prompt":
                    prompts.add(text)
                else:
                    responses.add(text)

        # Right section: columns 11-12
        if len(row) > 12 and row[11].strip() in ("Prompt", "Response"):
            text = row[12].strip()
            if text:
                if row[11].strip() == "Prompt":
                    prompts.add(text)
                else:
                    responses.add(text)

# Sort for consistent output
prompts_sorted = sorted(prompts)
responses_sorted = sorted(responses)

# Write prompts
prompts_path = os.path.join(OUT_DIR, "extracted_prompts.txt")
with open(prompts_path, "w", encoding="utf-8") as f:
    for i, p in enumerate(prompts_sorted, 1):
        # Replace any internal newlines with a space so each card is one line
        f.write(f"{i}. {p.replace(chr(10), ' ')}\n")

# Write responses
responses_path = os.path.join(OUT_DIR, "extracted_responses.txt")
with open(responses_path, "w", encoding="utf-8") as f:
    for i, r in enumerate(responses_sorted, 1):
        f.write(f"{i}. {r.replace(chr(10), ' ')}\n")

print(f"Unique prompts:   {len(prompts_sorted)}  ->  {prompts_path}")
print(f"Unique responses: {len(responses_sorted)}  ->  {responses_path}")
print(f"Total unique cards: {len(prompts_sorted) + len(responses_sorted)}")
