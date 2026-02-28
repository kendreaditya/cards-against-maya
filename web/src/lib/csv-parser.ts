import { Card } from './types';
import * as fs from 'fs';
import * as path from 'path';

export function parseCSV(filePath: string): Card[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const cards: Card[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line handling quoted fields
    let type: string;
    let text: string;

    if (line.startsWith('Prompt,') || line.startsWith('Response,')) {
      const commaIndex = line.indexOf(',');
      type = line.substring(0, commaIndex);
      text = line.substring(commaIndex + 1);
    } else {
      continue;
    }

    // Remove surrounding quotes if present
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1);
    }
    // Unescape doubled quotes
    text = text.replace(/""/g, '"');

    cards.push({
      id: 0, // will be assigned by DB
      type: type.toLowerCase() as 'prompt' | 'response',
      text,
      source: 'original',
    });
  }

  return cards;
}

export function getCSVPath(): string {
  return path.join(process.cwd(), 'data', 'cards_against_maya_top612.csv');
}
