import Database from 'better-sqlite3';
import path from 'path';
import { Card } from './types';
import { parseCSV, getCSVPath } from './csv-parser';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'cards.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
    seedIfEmpty();
  }
  return db;
}

function initSchema(): void {
  const database = db!;
  database.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('prompt', 'response')),
      text TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'original',
      is_top_scored INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS card_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      round_number INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (card_id) REFERENCES cards(id)
    );
  `);

  // Add is_top_scored column if it doesn't exist (migration for existing DBs)
  try {
    database.prepare('SELECT is_top_scored FROM cards LIMIT 1').get();
  } catch {
    database.exec('ALTER TABLE cards ADD COLUMN is_top_scored INTEGER NOT NULL DEFAULT 0');
  }
}

function seedIfEmpty(): void {
  const database = db!;
  const count = database.prepare('SELECT COUNT(*) as count FROM cards').get() as { count: number };

  if (count.count === 0) {
    const csvPath = getCSVPath();
    const cards = parseCSV(csvPath);

    // Load the curated top 612 card texts to flag them
    const topCsvPath = path.join(process.cwd(), 'data', 'cards_against_maya_top612.csv');
    let topTexts: Set<string>;
    try {
      const topCards = parseCSV(topCsvPath);
      topTexts = new Set(topCards.map((c) => c.text));
    } catch {
      topTexts = new Set();
    }

    const insert = database.prepare(
      'INSERT INTO cards (type, text, source, is_top_scored) VALUES (?, ?, ?, ?)'
    );

    const insertMany = database.transaction((cards: Card[]) => {
      for (const card of cards) {
        const isTop = topTexts.has(card.text) ? 1 : 0;
        insert.run(card.type, card.text, 'original', isTop);
      }
    });

    insertMany(cards);
    console.log(`Seeded ${cards.length} cards from CSV (${topTexts.size} flagged as top-scored)`);
  }
}

export function getAllCards(type?: string, source?: string): Card[] {
  const database = getDb();
  let query = 'SELECT id, type, text, source, is_top_scored FROM cards WHERE 1=1';
  const params: string[] = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }

  query += ' ORDER BY id';
  const rows = database.prepare(query).all(...params) as { id: number; type: 'prompt' | 'response'; text: string; source: 'original' | 'custom'; is_top_scored: number }[];
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    text: r.text,
    source: r.source,
    is_top_scored: !!r.is_top_scored,
  }));
}

export function addCard(type: 'prompt' | 'response', text: string): Card {
  const database = getDb();
  const result = database
    .prepare('INSERT INTO cards (type, text, source, is_top_scored) VALUES (?, ?, ?, 0)')
    .run(type, text, 'custom');

  return {
    id: result.lastInsertRowid as number,
    type,
    text,
    source: 'custom',
    is_top_scored: false,
  };
}

export function deleteCard(id: number): boolean {
  const database = getDb();
  const result = database
    .prepare('DELETE FROM cards WHERE id = ? AND source = ?')
    .run(id, 'custom');
  return result.changes > 0;
}

export function getCardsByType(): { prompts: Card[]; responses: Card[] } {
  const database = getDb();
  const prompts = database
    .prepare('SELECT id, type, text, source, is_top_scored FROM cards WHERE type = ?')
    .all('prompt') as Card[];
  const responses = database
    .prepare('SELECT id, type, text, source, is_top_scored FROM cards WHERE type = ?')
    .all('response') as Card[];
  return { prompts, responses };
}

export function rateCards(
  playerName: string,
  ratings: { cardId: number; rating: number }[],
  roundNumber: number
): void {
  const database = getDb();
  const insert = database.prepare(
    'INSERT INTO card_ratings (card_id, player_name, rating, round_number) VALUES (?, ?, ?, ?)'
  );
  const insertMany = database.transaction(() => {
    for (const r of ratings) {
      insert.run(r.cardId, playerName, r.rating, roundNumber);
    }
  });
  insertMany();
}
