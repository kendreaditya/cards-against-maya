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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seedIfEmpty(): void {
  const database = db!;
  const count = database.prepare('SELECT COUNT(*) as count FROM cards').get() as { count: number };

  if (count.count === 0) {
    const csvPath = getCSVPath();
    const cards = parseCSV(csvPath);

    const insert = database.prepare(
      'INSERT INTO cards (type, text, source) VALUES (?, ?, ?)'
    );

    const insertMany = database.transaction((cards: Card[]) => {
      for (const card of cards) {
        insert.run(card.type, card.text, 'original');
      }
    });

    insertMany(cards);
    console.log(`Seeded ${cards.length} cards from CSV`);
  }
}

export function getAllCards(type?: string, source?: string): Card[] {
  const database = getDb();
  let query = 'SELECT id, type, text, source FROM cards WHERE 1=1';
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
  return database.prepare(query).all(...params) as Card[];
}

export function addCard(type: 'prompt' | 'response', text: string): Card {
  const database = getDb();
  const result = database
    .prepare('INSERT INTO cards (type, text, source) VALUES (?, ?, ?)')
    .run(type, text, 'custom');

  return {
    id: result.lastInsertRowid as number,
    type,
    text,
    source: 'custom',
  };
}

export function deleteCard(id: number): boolean {
  const database = getDb();
  // Only allow deleting custom cards
  const result = database
    .prepare('DELETE FROM cards WHERE id = ? AND source = ?')
    .run(id, 'custom');
  return result.changes > 0;
}

export function getCardsByType(): { prompts: Card[]; responses: Card[] } {
  const database = getDb();
  const prompts = database
    .prepare('SELECT id, type, text, source FROM cards WHERE type = ?')
    .all('prompt') as Card[];
  const responses = database
    .prepare('SELECT id, type, text, source FROM cards WHERE type = ?')
    .all('response') as Card[];
  return { prompts, responses };
}
