import { Card } from './types';
import { isSupabaseConfigured, supabaseGetAllCards, supabaseGetCardsByType, supabaseAddCard, supabaseDeleteCard, supabaseRateCards } from './supabase';
import * as sqlite from './db';

// Unified data access layer: tries Supabase first, falls back to SQLite

export async function getAllCards(type?: string, source?: string): Promise<Card[]> {
  if (isSupabaseConfigured()) {
    try {
      return await supabaseGetAllCards(type, source);
    } catch (e) {
      console.warn('Supabase getAllCards failed, falling back to SQLite:', e);
    }
  }
  return sqlite.getAllCards(type, source);
}

export async function getCardsByType(): Promise<{ prompts: Card[]; responses: Card[] }> {
  if (isSupabaseConfigured()) {
    try {
      return await supabaseGetCardsByType();
    } catch (e) {
      console.warn('Supabase getCardsByType failed, falling back to SQLite:', e);
    }
  }
  return sqlite.getCardsByType();
}

export async function addCard(type: 'prompt' | 'response', text: string): Promise<Card> {
  if (isSupabaseConfigured()) {
    try {
      return await supabaseAddCard(type, text);
    } catch (e) {
      console.warn('Supabase addCard failed, falling back to SQLite:', e);
    }
  }
  return sqlite.addCard(type, text);
}

export async function deleteCard(id: number): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      return await supabaseDeleteCard(id);
    } catch (e) {
      console.warn('Supabase deleteCard failed, falling back to SQLite:', e);
    }
  }
  return sqlite.deleteCard(id);
}

export async function rateCards(
  playerName: string,
  ratings: { cardId: number; rating: number }[],
  roundNumber: number
): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseRateCards(playerName, ratings, roundNumber);
      return;
    } catch (e) {
      console.warn('Supabase rateCards failed, falling back to SQLite:', e);
    }
  }
  sqlite.rateCards(playerName, ratings, roundNumber);
}
